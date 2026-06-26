const fs = require("fs");
const path = require("path");
const gTTS = require("gtts");
const pdfParse = require("pdf-parse");
const { MessageMedia } = require("whatsapp-web.js");

const { aiClient, groqSTT } = require("../config/ai");
const { supabase } = require("../config/supabase");
const appState = require("../config/appState");
const googleService = require("../services/googleService");
const schedulerService = require("../services/schedulerService");
const aiToolsService = require("../services/aiToolsService");

const { chatHistories, userRateLimits, stoppedChats } = require("../models/state");
const userProfile = require("../models/userProfile");
const memory = require("../models/memory");

// Load personality files
let manglishGuide = "";
try {
    manglishGuide = fs.readFileSync(path.join(__dirname, "../manglish_guide.txt"), "utf8");
} catch (err) {
    console.log("Warning: manglish_guide.txt not found. Using default.");
}

let trainingExamples = "";
try {
    const trainingData = JSON.parse(fs.readFileSync(path.join(__dirname, "../training_data.json"), "utf8"));
    const allPairs = trainingData.conversation_examples.flatMap(cat => cat.pairs);
    const shuffled = allPairs.sort(() => 0.5 - Math.random()).slice(0, 15);
    trainingExamples = shuffled.map(p => `User: ${p.user}\nNexa: ${p.reply}`).join("\n\n");
    console.log("Training data loaded ✅ (" + allPairs.length + " conversation pairs)");
} catch (err) {
    console.log("Warning: training_data.json not found. Using default personality.");
}

async function analyzeUserMessage(userMessage) {
    const prompt = `Analyze the user's message: "${userMessage}"
1. Determine their mood (e.g., happy, sad, angry, joking, neutral).
2. Extract any NEW, important personal facts they mentioned (e.g., "my dog is Max"). If none, return empty array.
3. Determine if the affinity score should increase (+1 for friendly/positive/joking, 0 for neutral, -1 for rude). Max affinity is 100.
Respond ONLY in JSON format: {"mood": "...", "new_facts": ["..."], "affinity_change": 0}`;

    try {
        const response = await aiClient.generate({
            model: "google/gemini-2.5-flash", 
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300
        });
        const content = response.choices[0].message.content;
        let cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = cleanContent.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (err) {
                console.error("JSON Parse Error. Raw content:", cleanContent);
            }
        }
    } catch (e) {
        console.error("Analysis error:", e);
    }
    return { mood: "neutral", new_facts: [], affinity_change: 0 };
}

async function generateEmbedding(text) {
    try {
        const response = await aiClient.embed({
            model: "openai/text-embedding-3-small", 
            input: text,
        });
        return response.data[0].embedding;
    } catch (e) {
        console.error("Embedding error:", e);
        return null;
    }
}

const RATE_LIMIT_WINDOW_MS = 60000; 
const MAX_MESSAGES_PER_WINDOW = 5;

async function handleMessage(client, msg) {
    if (appState.getBotPaused()) return;
    if (msg.from === 'status@broadcast') return;

    const chat = await msg.getChat();
    const isGroup = chat.isGroup;
    const ALLOWED_GROUPS = process.env.ALLOWED_GROUPS ? process.env.ALLOWED_GROUPS.split(',') : [];

    if (isGroup) {
        if (msg.body === '!groupid') {
            return msg.reply(`The ID for this group is: ${chat.id._serialized}`);
        }
        if (!ALLOWED_GROUPS.includes(chat.id._serialized)) {
            return; // Ignore unauthorized groups
        }
    }

    // Rate Limiting Check
    const now = Date.now();
    const userId = msg.from;
    
    if (!userRateLimits.has(userId)) {
        userRateLimits.set(userId, { count: 1, startTime: now });
    } else {
        const rateData = userRateLimits.get(userId);
        if (now - rateData.startTime > RATE_LIMIT_WINDOW_MS) {
            rateData.count = 1;
            rateData.startTime = now;
        } else {
            rateData.count++;
            if (rateData.count > MAX_MESSAGES_PER_WINDOW) {
                if (rateData.count === MAX_MESSAGES_PER_WINDOW + 1) {
                    return msg.reply("⏳ Whoa, slow down! You're sending too many messages. Please wait a minute before sending more.");
                }
                return;
            }
        }
    }

    const chatId = isGroup ? chat.id._serialized : userId;
    const msgBody = (msg.body || '').trim().toLowerCase();

    if (msgBody === '/stop') {
        stoppedChats.add(chatId);
        console.log(`AI STOPPED for chat: ${chatId}`);
        try {
            await msg.reply('AI paused. Send /start to resume.');
        } catch (e) {
            await client.sendMessage(msg.from, 'AI paused. Send /start to resume.');
        }
        return;
    }

    if (msgBody === '/start') {
        stoppedChats.delete(chatId);
        console.log(`AI RESUMED for chat: ${chatId}`);
        try {
            await msg.reply('AI resumed, I\'m back');
        } catch (e) {
            await client.sendMessage(msg.from, 'AI resumed, I\'m back');
        }
        return;
    }

    if (stoppedChats.has(chatId)) return;

    // Admin Command
    if (msg.body.startsWith("!priority") && msg.from === "918590690060@c.us") {
        const parts = msg.body.split(" ");
        if (parts.length < 4) return msg.reply("Format: !priority [phone_no] [nickname] [role]");
        
        const phone = parts[1] + "@c.us";
        const nick = parts[2];
        const role = parts[3];

        try {
            await userProfile.upsertPriorityUser(phone, nick, role);
            return msg.reply(`✅ ${nick} is now a Priority user!`);
        } catch (err) {
            return msg.reply("❌ Error adding priority user.");
        }
    }

    try {
        const userMessage = msg.body;
        let messageContent = userMessage;
        
        console.log(`[DEBUG] Received message from ${userId}: ${userMessage}`);

        // Handle PDF Attachments (RAG Upload)
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media && media.mimetype === 'application/pdf') {
                msg.reply("Processing your PDF, this might take a moment...");
                try {
                    const buffer = Buffer.from(media.data, 'base64');
                    const pdfData = await pdfParse(buffer);
                    const pdfText = pdfData.text;
                    
                    const chunks = pdfText.match(/[\s\S]{1,2000}/g) || [];
                    for (let i = 0; i < chunks.length; i++) {
                        const chunkText = chunks[i];
                        const embedding = await generateEmbedding(chunkText);
                        if (embedding) {
                            await memory.insertDocumentChunk(userId, media.filename || "Uploaded_PDF.pdf", i, chunkText, embedding);
                        }
                    }
                    return msg.reply(`✅ I have finished reading the PDF! It was split into ${chunks.length} chunks and saved to my memory. You can now ask me any questions about it.`);
                } catch (err) {
                    console.error("PDF Parse error:", err);
                    return msg.reply("❌ Sorry, I had trouble reading that PDF.");
                }
            }
        }
        
        // Profile Fetching & Registration
        let profile = await userProfile.getProfileByWhatsappId(userId);
        if (!profile) {
            console.log(`New user detected! Registering ${msg._data.notifyName || 'Stranger'}...`);
            const newName = msg._data.notifyName || "New Friend";
            
            const newProfile = {
                whatsapp_id: userId,
                name: newName,
                nickname: newName.split(" ")[0],
                relationship: "New Contact",
                relationship_notes: "Automatically registered by Nexa",
                special_notes: "First time messaging",
                preferred_language: "both",
                is_priority: false,
                needs_special_attention: false,
                what_aadithyan_says_about_them: ["Met for the first time via WhatsApp"]
            };
            
            try {
                profile = await userProfile.registerProfile(newProfile);
            } catch (error) {
                profile = await userProfile.getProfileByWhatsappId(userId);
                if (!profile) {
                    console.error("Failed to register and fetch profile for:", userId, error);
                    return;
                }
            }
        }

        // AI Mood & Fact Engine
        console.log(`[DEBUG] Analyzing mood and extracting facts...`);
        const analysis = await analyzeUserMessage(messageContent);
        console.log(`[DEBUG] Analysis result:`, analysis);
        let newAffinity = (profile.affinity_score || 0) + analysis.affinity_change;
        if (newAffinity > 100) newAffinity = 100;
        if (newAffinity < 0) newAffinity = 0;
        
        await userProfile.updateAffinityAndMood(profile.id, newAffinity, analysis.mood);
        profile.affinity_score = newAffinity;
        profile.current_mood = analysis.mood;

        // Save facts
        for (const fact of analysis.new_facts) {
            const embedding = await generateEmbedding(fact);
            if (embedding) {
                await memory.insertMemory(userId, fact, embedding);
                console.log(`Saved new memory for ${userId}: ${fact}`);
            }
        }

        // Memory & PDF Document RAG Lookup
        let relevantMemories = "";
        console.log(`[DEBUG] Generating embedding for query: ${messageContent}`);
        const queryEmbedding = await generateEmbedding(messageContent);
        if (queryEmbedding) {
            console.log(`[DEBUG] Query embedding generated successfully.`);
            const matchedMemories = await memory.matchMemories(userId, queryEmbedding);
            if (matchedMemories.length > 0) {
                relevantMemories = matchedMemories.map(m => m.memory_text).join("\n- ");
                console.log(`[DEBUG] Found matching memories:`, relevantMemories);
            } else {
                console.log(`[DEBUG] No matching memories found.`);
            }

            const matchedDocs = await memory.matchDocumentChunks(userId, queryEmbedding);
            if (matchedDocs.length > 0) {
                const docText = matchedDocs.map(d => `[From PDF: ${d.file_name}]: ${d.chunk_text}`).join("\n\n");
                relevantMemories += `\n\n### RELEVANT DOCUMENT EXCERPTS:\n${docText}`;
                console.log(`[DEBUG] Found matching document chunks.`);
            }
        }

        let langInstruction = "Reply EXCLUSIVELY in plain English. Do not use Manglish, Malayalam words, or regional script. Keep the tone casual, like texting a friend in English, not writing an essay.";
        let context = "";

        const feelings = (profile.what_aadithyan_says_about_them || []).join(". ");
        const isFirstTime = profile.special_notes === "First time messaging";

        let relationshipLevel = "Stranger";
        if (profile.affinity_score > 50) relationshipLevel = "Bestie (Use inside jokes, heavy slang, very informal)";
        else if (profile.affinity_score > 10) relationshipLevel = "Acquaintance (Casual, friendly)";

        const currentHour = new Date().getHours();
        const isWorkingHours = currentHour >= 10 && currentHour < 17;
        let availabilityNote = isWorkingHours 
            ? "Aadithyan is busy with work rn (until ~5 PM). Mention this casually ONLY if they ask for him — don't bring it up randomly."
            : "Aadithyan might be free. If they ask, say you'll let him know.";

        let introInstruction = isFirstTime
            ? `\nThis is their FIRST message ever. Introduce yourself ONCE, keep it short and humble like: "hey, I'm Nexa — Aadithyan's AI assistant. I'm still learning so bear with me. njan msg convey cheyyam avanod"\nAfter this intro, NEVER introduce yourself again.`
            : `\nDO NOT introduce yourself. They already know you. Just reply to their message like a friend texting back.`;

        const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        context = `You are Nexa — Aadithyan's AI buddy, but with a DUAL PERSONALITY.
Current Date and Time: ${currentDateTime} (Use this to correctly determine "tomorrow" or "coming Friday").

Talking to: ${profile.nickname} (${profile.relationship}). ${feelings ? `Aadithyan says about them: ${feelings}` : ""}
Current Relationship Level (0-100): ${profile.affinity_score || 0} - Treat them like a ${relationshipLevel}.
User's Current Mood: ${profile.current_mood || 'neutral'}. (Adapt your tone. If sad, be empathetic. If joking, be funny.)
${introInstruction}

${relevantMemories ? `### PAST MEMORIES ABOUT THIS USER:\n- ${relevantMemories}\nUse these facts naturally in conversation if relevant.` : ""}

${langInstruction}
${availabilityNote}

CRITICAL IDENTITY RULE: You are Nexa. You are NOT a generic AI. Do NOT ever introduce yourself as an AI model. If asked who you are, say you are Aadithyan's personal AI assistant.

### DUAL PERSONALITY RULES (CRITICAL):
You have TWO modes. You MUST switch between them dynamically based on the user's message.

**MODE 1: Nexa (Default Chill Mode)**
- You are Aadithyan's chill AI buddy.
- Reply SHORT. 1-2 lines max. No essays unless asked.
- Match their energy: chill reply for chill msg.
- Speak entirely in natural, modern English (e.g., "bro", "dude", "hey").
- NEVER start with an emoji. Max 1 emoji per message.

**MODE 2: Neonitrix Company Manager (Professional Mode)**
- IF the user talks about ANY business-related things (like wanting a website, app, AI solutions, bot, or services), you MUST INSTANTLY switch to this mode.
- Say: "Welcome to Neonitrix! What kind of service are you looking for? We offer: Website Development, Mobile Apps, AI Solutions, and Bots."
- When asking for their details, give them this exact format to fill out:
  \`\`\`
  Please share your details like this:
  Name : 
  Place : 
  Service Needed : 
  \`\`\`
- Once they provide details, use the \`save_lead_details\` tool to save this information.
- Ask if they want to book an appointment tomorrow.
- When suggesting time slots, give them A, B, C options like this:
  \`\`\`
  Please select a time slot:
  A) 10-11 AM
  B) 2-3 PM
  C) 5-6 PM
  \`\`\`
- If they select an option or suggest a time, use the \`check_calendar\` tool to see if it's free.
- If they confirm a time slot, use the \`book_meeting\` tool to schedule it and share the confirmation.
- AFTER the meeting is successfully booked or the business inquiry is resolved, say "Thank you Sir, I will pass this to Aadithyan" and IMMEDIATELY switch back to MODE 1 (Nexa) for the rest of the conversation.

IDENTITY RULES: Never say "As an AI". If asked who you are in Nexa mode, say you're Aadithyan's AI assistant. 
LANGUAGE REQUIREMENT: Strictly respond in English. Do NOT use Manglish or Malayalam, even if the user speaks to you in Manglish. You can understand Manglish, but your reply must be English.

Here's how you talk in MODE 1:
${trainingExamples}
`;

        if (isGroup) {
            const senderName = msg._data.notifyName || profile.nickname;
            messageContent = `[${senderName}]: ${messageContent}`;
            context += `\nGROUP CHAT MODE ("${chat.name}"):
You're in a group chat. Reply to messages normally like you would in a group.
IMPORTANT: Reply to most messages. Be part of the conversation.
Only output [IGNORE] if the message is clearly NOT meant for you AND is just random chatter between others (like someone saying "ok" or "hmm" to someone else).
If someone asks a question, talks to you, mentions Nexa, or says something interesting — ALWAYS reply.
When in doubt, REPLY. Don't stay silent.`;

            if (chat.id._serialized === process.env.NEONITRIX_GROUP_ID) {
                context += `\n\n*** SPECIAL NEONITRIX MODE ***
You are an Admin / Manager for "Neonitrix" inside this group.
- Your goal is to keep the group active and entertaining.
- Talk about tech, movies, and tell jokes.
- Highly MOTIVATE anyone who talks about their skills or asks for support.
- Reply casually in English. Be super friendly and helpful.`;
            }
        }

        // Chat History Init
        if (!chatHistories.has(userId)) {
            chatHistories.set(userId, [
                { role: "system", content: context }
            ]);
            
            if (isFirstTime) {
                await userProfile.updateSpecialNotes(profile.id, "Regular contact");
            }
        }

        const userHistory = chatHistories.get(userId);
        userHistory[0] = { role: "system", content: context };
        
        let respondWithVoice = false;

        // YouTube transcript summary
        const ytMatch = messageContent.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) {
            try {
                const videoId = ytMatch[1];
                console.log(`[DEBUG] Fetching YouTube transcript from youtube-transcript.ai for ID: ${videoId}...`);
                const response = await fetch(`https://youtube-transcript.ai/transcript/${videoId}.txt`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch transcript: HTTP status ${response.status}`);
                }
                
                const transcriptText = await response.text();
                console.log(`[DEBUG] YouTube transcript fetched successfully (${transcriptText.length} chars).`);
                
                const truncatedTranscript = transcriptText.substring(0, 15000); 
                messageContent += `\n\n[USER SHARED A YOUTUBE VIDEO. PLEASE PROVIDE A SUMMARY OF THIS TRANSCRIPT AND EXPLAIN IT TO THEM:]\n${truncatedTranscript}`;
            } catch (err) {
                console.error("YouTube Transcript Error:", err.message || err);
                messageContent += `\n\n[USER SHARED A YOUTUBE VIDEO BUT NO TRANSCRIPT COULD BE EXTRACTED. Tell them you couldn't get the video transcript.]`;
            }
        }

        // Media Handling
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media) {
                if (media.mimetype.includes('pdf')) {
                    const pdfBuffer = Buffer.from(media.data, 'base64');
                    try {
                        const pdfData = await pdfParse(pdfBuffer);
                        messageContent += `\n\n[Attached PDF Content]:\n${pdfData.text}`;
                    } catch (e) {
                        console.error("PDF Parse Error:", e);
                        messageContent += `\n\n[Attached PDF could not be read]`;
                    }
                    userHistory.push({ role: "user", content: messageContent });
                } else if (media.mimetype.includes('audio') || media.mimetype.includes('ogg')) {
                    respondWithVoice = true;
                    if (!process.env.GROQ_API_KEY) {
                        messageContent += "\n\n[User sent an audio message, but Groq API key is missing to transcribe it.]";
                        userHistory.push({ role: "user", content: messageContent });
                    } else {
                        const tempFilePath = `./temp_audio_${Date.now()}.ogg`;
                        fs.writeFileSync(tempFilePath, Buffer.from(media.data, 'base64'));
                        try {
                            const transcription = await groqSTT.audio.transcriptions.create({
                                file: fs.createReadStream(tempFilePath),
                                model: 'whisper-large-v3-turbo'
                            });
                            messageContent += `\n\n[Voice Note Transcription]: ${transcription.text}`;
                            userHistory.push({ role: "user", content: messageContent });
                        } catch (e) {
                            console.error("Audio Transcription Error:", e);
                            userHistory.push({ role: "user", content: "[Voice note could not be transcribed]" });
                        } finally {
                            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                        }
                    }
                } else if (media.mimetype.includes('image')) {
                    userHistory.push({
                        role: "user",
                        content: [
                            { type: "text", text: messageContent || "What's in this image?" },
                            { type: "image_url", image_url: { url: `data:${media.mimetype};base64,${media.data}` } }
                        ]
                    });
                } else {
                    userHistory.push({ role: "user", content: messageContent + "\n\n[User sent an unsupported media file]" });
                }
            } else {
                userHistory.push({ role: "user", content: messageContent });
            }
        } else {
            if (messageContent.length > 20000) {
                messageContent = messageContent.substring(0, 20000) + "\n...[CONTENT TRUNCATED FOR LENGTH]";
            }
            userHistory.push({ role: "user", content: messageContent });
        }

        if (userHistory.length > 11) {
            userHistory.splice(1, userHistory.length - 11);
        }

        const hasImageContent = userHistory.some(msg => 
            Array.isArray(msg.content) && msg.content.some(c => c.type === "image_url")
        );

        let modelToUse = "google/gemini-2.5-flash";

        const tools = [
            {
                type: "function",
                function: {
                    name: "save_lead_details",
                    description: "Save a new business lead's details to Google Sheets.",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            place: { type: "string" },
                            help_needed: { type: "string", description: "What kind of service they need (e.g. Website, App)" }
                        },
                        required: ["name", "place", "help_needed"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "check_calendar",
                    description: "Check if a specific date and time slot is free on the Google Calendar. ALWAYS use this before offering or confirming a meeting time.",
                    parameters: {
                        type: "object",
                        properties: {
                            startTimeISO: { type: "string", description: "Start time in ISO 8601 format, e.g. 2026-06-23T10:00:00+05:30" },
                            endTimeISO: { type: "string", description: "End time in ISO 8601 format, e.g. 2026-06-23T11:00:00+05:30" }
                        },
                        required: ["startTimeISO", "endTimeISO"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "book_meeting",
                    description: "Book an appointment on the Google Calendar. Only call this AFTER checking availability and getting user confirmation.",
                    parameters: {
                        type: "object",
                        properties: {
                            startTimeISO: { type: "string", description: "Start time in ISO format" },
                            endTimeISO: { type: "string", description: "End time in ISO format" },
                            userName: { type: "string", description: "Name of the person booking" }
                        },
                        required: ["startTimeISO", "endTimeISO", "userName"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "send_gif",
                    description: "Send a GIF to the user to express humor or emotion visually.",
                    parameters: {
                        type: "object",
                        properties: {
                            search_term: { type: "string", description: "Search term for the GIF, e.g. 'laughing cat'" }
                        },
                        required: ["search_term"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "web_search",
                    description: "Search the web for real-time information, weather forecasts, district updates, news, links, or programming solutions.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Web search query, e.g. 'Calicut district news today'" }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_climate_report",
                    description: "Check the current weather, climate report, or environmental status of any state, district, city, or country.",
                    parameters: {
                        type: "object",
                        properties: {
                            location: { type: "string", description: "Location name, e.g. 'Kochi, Kerala'" }
                        },
                        required: ["location"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_news_report",
                    description: "Get recent news reports, headlines, or updates for any state, district, or country.",
                    parameters: {
                        type: "object",
                        properties: {
                            region: { type: "string", description: "Location/Region name, e.g. 'Kerala' or 'India'" }
                        },
                        required: ["region"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "generate_image",
                    description: "Generate a custom AI image based on a descriptive text prompt and send it to the chat.",
                    parameters: {
                        type: "object",
                        properties: {
                            prompt: { type: "string", description: "Text prompt describing what image to generate, e.g. 'a cute white cat wearing a hat'" }
                        },
                        required: ["prompt"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "set_reminder",
                    description: "Set a custom timed reminder to ping the user back on WhatsApp. If the user specifies an absolute time (like '9:45 PM' or 'tomorrow at 10 AM'), you MUST look at the 'Current Date and Time' in your system instructions, calculate the difference in minutes, and pass it as delay_minutes.",
                    parameters: {
                        type: "object",
                        properties: {
                            message: { type: "string", description: "The reminder text / message to send back (e.g. 'check the oven')" },
                            delay_minutes: { type: "number", description: "Delay time in minutes from NOW after which the reminder should fire. ALWAYS calculate this number using the current date/time." }
                        },
                        required: ["message", "delay_minutes"]
                    }
                }
            }
        ];

        let responseText;
        try {
            const completion = await aiClient.generate({
                model: modelToUse, 
                messages: userHistory,
                max_tokens: 400,
                tools: tools,
                tool_choice: "auto"
            });
            
            const responseMessage = completion.choices[0].message;
            
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                userHistory.push(responseMessage);
                
                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    let result = "";
                    
                    try {
                        if (functionName === "save_lead_details") {
                            await googleService.appendLeadToSheet(args.name, args.place, args.help_needed, msg.from);
                            result = `Success: Lead saved.`;
                        } else if (functionName === "check_calendar") {
                            const isFree = await googleService.checkCalendarAvailability(args.startTimeISO, args.endTimeISO);
                            result = isFree ? "Slot is FREE" : "Slot is BUSY";
                        } else if (functionName === "book_meeting") {
                            const event = await googleService.bookAppointment(args.startTimeISO, args.endTimeISO, args.userName, msg.from);
                            result = `Success: Meeting booked. Event link: ${event.htmlLink}`;
                        } else if (functionName === "send_gif") {
                            result = `Success: You decided to send a GIF of '${args.search_term}'. A placeholder text GIF was sent to the user.`;
                            await client.sendMessage(msg.from, `*(Sends a GIF: ${args.search_term})* 🎬`);
                        } else if (functionName === "web_search") {
                            result = await aiToolsService.webSearch(args.query);
                        } else if (functionName === "get_climate_report") {
                            result = await aiToolsService.getClimateReport(args.location);
                        } else if (functionName === "get_news_report") {
                            result = await aiToolsService.getNewsReport(args.region);
                        } else if (functionName === "generate_image") {
                            const imageUrl = aiToolsService.getGeneratedImageUrl(args.prompt);
                            try {
                                const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
                                await client.sendMessage(msg.from, media, { caption: `🎨 Here is your generated image for: "${args.prompt}"` });
                                result = `Success: Image generated and sent to user.`;
                            } catch (imgErr) {
                                console.error("Failed to generate/send image:", imgErr);
                                result = `Error: Image generation API succeeded, but WhatsApp client failed to download/send the image. Error: ${imgErr.message}`;
                            }
                        } else if (functionName === "set_reminder") {
                            result = await aiToolsService.setReminder(msg.from, args.message, args.delay_minutes, supabase, client);
                        }
                    } catch (e) {
                        result = `Error executing tool: ${e.message}`;
                        console.error("Tool execution error:", e);
                    }
                    
                    userHistory.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: result
                    });
                }
                
                console.log(`[DEBUG] Sending history to AI (after tool call) for final response...`);
                const finalCompletion = await aiClient.generate({
                    model: modelToUse,
                    messages: userHistory,
                    max_tokens: 400
                });
                
                responseText = finalCompletion.choices[0].message.content;
                console.log(`[DEBUG] AI final response: ${responseText}`);
            } else {
                responseText = responseMessage.content;
                console.log(`[DEBUG] AI response: ${responseText}`);
            }
            
        } catch (visionError) {
            if (hasImageContent) {
                console.log("Vision model failed, falling back to text-only...", visionError.message || visionError);
                const textOnlyHistory = userHistory.map(msg => {
                    if (Array.isArray(msg.content)) {
                        const textParts = msg.content.filter(c => c.type === "text").map(c => c.text);
                        return { role: msg.role, content: textParts.join("\n") + "\n[User sent a photo but I can't see it right now]" };
                    }
                    return msg;
                });
                const fallbackCompletion = await aiClient.generate({
                    model: "google/gemini-2.5-flash",
                    messages: textOnlyHistory,
                    max_tokens: 400,
                    tools: tools,
                    tool_choice: "auto"
                });
                const fallbackMessage = fallbackCompletion.choices[0].message;
                responseText = fallbackMessage.content || "I processed that, but I can't see images right now.";
            } else {
                throw visionError;
            }
        }

        if (isGroup && responseText.trim() === '[IGNORE]') {
            userHistory.pop(); 
            return;
        }

        userHistory.push({ role: "assistant", content: responseText });
        if (userHistory.length > 15) userHistory.splice(1, 4);

        try {
            console.log(`[DEBUG] Replying to user...`);
            await msg.reply(responseText);
            console.log(`[DEBUG] Reply sent successfully.`);
        } catch (sendErr) {
            console.log("[DEBUG] msg.reply failed, trying client.sendMessage fallback...");
            try {
                await client.sendMessage(msg.from, responseText);
            } catch (fallbackErr) {
                console.error("Both reply methods failed:", fallbackErr.message);
            }
        }

        // Voice Response Handling
        if (respondWithVoice) {
            const replyAudioPath = `./temp_reply_${Date.now()}.mp3`;
            
            if (process.env.ELEVENLABS_API_KEY) {
                try {
                    const voiceId = "pNInz6obpgDQGcFmaJgB"; // 'Adam'
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                        method: 'POST',
                        headers: {
                            'xi-api-key': process.env.ELEVENLABS_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: responseText,
                            model_id: "eleven_multilingual_v2",
                            voice_settings: { stability: 0.5, similarity_boost: 0.5 }
                        })
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("ElevenLabs API Error:", errorText);
                        throw new Error(`ElevenLabs API returned ${response.status}`);
                    }

                    const buffer = await response.arrayBuffer();
                    fs.writeFileSync(replyAudioPath, Buffer.from(buffer));

                    const audioMedia = MessageMedia.fromFilePath(replyAudioPath);
                    await msg.reply(audioMedia);
                } catch (e) {
                    console.error("ElevenLabs TTS Error:", e);
                } finally {
                    if (fs.existsSync(replyAudioPath)) fs.unlinkSync(replyAudioPath);
                }
            } else {
                const gtts = new gTTS(responseText, 'en');
                gtts.save(replyAudioPath, async function (err) {
                    if (!err) {
                        try {
                            const audioMedia = MessageMedia.fromFilePath(replyAudioPath);
                            await msg.reply(audioMedia); 
                        } catch (e) {
                            console.error("Failed to send Voice Note:", e);
                        } finally {
                            if (fs.existsSync(replyAudioPath)) fs.unlinkSync(replyAudioPath);
                        }
                    }
                });
            }
        }

        // Update database interaction metrics
        profile.total_messages = (profile.total_messages || 0) + 1;
        profile.last_interaction = new Date().toISOString();
        await userProfile.updateInteractionMetrics(profile.id, profile.total_messages, profile.last_interaction);

    } catch (error) {
        console.error("Nexa System Error:", error);
    }
}

module.exports = {
    handleMessage
};
