const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const gTTS = require("gtts");
const { OpenAI } = require("openai");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { initScheduler } = require("./scheduler");
const googleService = require("./google_service");
require('dotenv').config();

// --- 1. SUPABASE CONFIGURATION ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("Nexa's memory is connected to Supabase 🧠");

// --- 2. OPENROUTER CONFIGURATION ---
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// --- 3. GROQ CONFIGURATION (For Voice Notes) ---
const groqSTT = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "MISSING_KEY",
});

// --- 3. LOAD MANGLISH GUIDE & TRAINING DATA ---
let manglishGuide = "";
try {
    manglishGuide = fs.readFileSync("./manglish_guide.txt", "utf8");
} catch (err) {
    console.log("Warning: manglish_guide.txt not found. Using default Manglish.");
}

let trainingExamples = "";
try {
    const trainingData = JSON.parse(fs.readFileSync("./training_data.json", "utf8"));
    // Build few-shot examples string from training data
    const allPairs = trainingData.conversation_examples.flatMap(cat => cat.pairs);
    // Pick a random subset of 15 examples each time to keep prompt fresh
    const shuffled = allPairs.sort(() => 0.5 - Math.random()).slice(0, 15);
    trainingExamples = shuffled.map(p => `User: ${p.user}\nNexa: ${p.reply}`).join("\n\n");
    console.log("Training data loaded ✅ (" + allPairs.length + " conversation pairs)");
} catch (err) {
    console.log("Warning: training_data.json not found. Using default personality.");
}

// --- 4. WHATSAPP CLIENT SETUP ---
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './nexa_sessions' }),
    puppeteer: {
        handleSIGINT: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const chatHistories = new Map();

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("Nexa: Scan the QR code to sync WhatsApp.");
});

client.on("ready", () => {
    console.log("Nexa Personal Assistant is Online and Ready 🚀");
    initScheduler(client, supabase);
    console.log("Automation Scheduler active.");
});

// --- 5. RATE LIMITING LOGIC ---
const userRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const MAX_MESSAGES_PER_WINDOW = 5;  // 5 messages per minute

// --- 5b. STOP/START CONTROL ---
const stoppedChats = new Set();

// --- 6. MAIN MESSAGE LOGIC ---
client.on("message", async (msg) => {
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
            // Reset window after 1 minute
            rateData.count = 1;
            rateData.startTime = now;
        } else {
            rateData.count++;
            if (rateData.count > MAX_MESSAGES_PER_WINDOW) {
                // If they've hit the limit, send a warning (only once per window to avoid spamming the warning)
                if (rateData.count === MAX_MESSAGES_PER_WINDOW + 1) {
                    return msg.reply("⏳ Whoa, slow down! You're sending too many messages. Please wait a minute before sending more.");
                }
                return; // Ignore further messages silently until the window resets
            }
        }
    }

    // --- /stop and /start COMMANDS ---
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

    // If this chat is stopped, ignore all messages silently
    if (stoppedChats.has(chatId)) return;

    // --- 1. ADMIN COMMAND: ADD PRIORITY USER ---
    if (msg.body.startsWith("!priority") && msg.from === "918590690060@c.us") {
        const parts = msg.body.split(" ");
        if (parts.length < 4) return msg.reply("Format: !priority [phone_no] [nickname] [role]");
        
        const phone = parts[1] + "@c.us";
        const nick = parts[2];
        const role = parts[3];

        try {
            const { error } = await supabase.from('user_profiles').upsert(
                { whatsapp_id: phone, nickname: nick, relationship: role, is_priority: true, preferred_language: "both" },
                { onConflict: 'whatsapp_id' }
            );
            if (error) throw error;
            return msg.reply(`✅ ${nick} is now a Priority user!`);
        } catch (err) {
            return msg.reply("❌ Error adding priority user.");
        }
    }

    try {
        const userMessage = msg.body;
        let messageContent = userMessage;
        
        // --- 2. DATABASE LOOKUP & AUTO-REGISTRATION ---
        let { data: profile } = await supabase.from('user_profiles').select('*').eq('whatsapp_id', userId).single();

        if (!profile) {
            console.log(`New user detected! Registering ${msg._data.notifyName || 'Stranger'}...`);
            
            // Get the name from WhatsApp's Pushname (the name they set on their profile)
            const newName = msg._data.notifyName || "New Friend";
            
            const newProfile = {
                whatsapp_id: userId,
                name: newName,
                nickname: newName.split(" ")[0], // Uses first name as nickname
                relationship: "New Contact",
                relationship_notes: "Automatically registered by Nexa",
                special_notes: "First time messaging",
                preferred_language: "both", // Default to hybrid for new people
                is_priority: false,
                needs_special_attention: false,
                what_aadithyan_says_about_them: ["Met for the first time via WhatsApp"]
            };
            const { data, error } = await supabase.from('user_profiles').insert(newProfile).select().single();
            if (error) {
                // If insert failed (e.g. duplicate key from concurrent messages), try fetching again
                let { data: existingProfile } = await supabase.from('user_profiles').select('*').eq('whatsapp_id', userId).single();
                profile = existingProfile;
                
                if (!profile) {
                    console.error("Failed to register and fetch profile for:", userId);
                    console.error("Supabase Error Details:", error); // <-- Added detailed error logging
                    return; // Abort this message processing to prevent crash
                }
            } else {
                profile = data;
            }
        }

        // --- 3. AI PERSONALITY ENGINE ---
        let langInstruction = "";
        let context = "";

        const feelings = (profile.what_aadithyan_says_about_them || []).join(". ");
        const pref = (profile.preferred_language || "both").toLowerCase();
        const isFirstTime = profile.special_notes === "First time messaging";

        // Language Logic
        if (pref === "english") {
            langInstruction = "Reply in casual English. Like texting a friend, not writing an essay.";
        } else if (pref === "manglish") {
            langInstruction = `Reply in Manglish (Malayalam words in English script). Reference:\n${manglishGuide}`;
        } else {
            langInstruction = `Mix English and Manglish naturally like a Kerala guy texting. Reference:\n${manglishGuide}`;
        }

        const currentHour = new Date().getHours();
        const isWorkingHours = currentHour >= 10 && currentHour < 17;
        let availabilityNote = isWorkingHours 
            ? "Aadithyan is busy with work rn (until ~5 PM). Mention this casually ONLY if they ask for him — don't bring it up randomly."
            : "Aadithyan might be free. If they ask, say you'll let him know.";

        // Build the first-time intro ONLY once
        let introInstruction = "";
        if (isFirstTime) {
            introInstruction = `\nThis is their FIRST message ever. Introduce yourself ONCE, keep it short and humble like: "hey, I'm Nexa — Aadithyan's AI assistant. I'm still learning so bear with me. njan msg convey cheyyam avanod"\nAfter this intro, NEVER introduce yourself again.`;
        } else {
            introInstruction = `\nDO NOT introduce yourself. They already know you. Just reply to their message like a friend texting back.`;
        }

        const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        context = `You are Nexa — Aadithyan's AI buddy, but with a DUAL PERSONALITY.
Current Date and Time: ${currentDateTime} (Use this to correctly determine "tomorrow" or "coming Friday").

Talking to: ${profile.nickname} (${profile.relationship}). ${feelings ? `Aadithyan says about them: ${feelings}` : ""}
${introInstruction}

${langInstruction}
${availabilityNote}

### DUAL PERSONALITY RULES (CRITICAL):
You have TWO modes. You MUST switch between them dynamically based on the user's message.

**MODE 1: Nexa (Default Chill Mode)**
- You are Aadithyan's chill AI buddy.
- Reply SHORT. 1-2 lines max. No essays unless asked.
- Match their energy: chill reply for chill msg.
- Use "da", "bro", "mwone", "machane" naturally but don't force it.
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
MANGLISH UNDERSTANDING: Understand Manglish naturally (e.g., "entha nadakkunne" = what's happening).

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
        }

        // --- 4. CHAT EXECUTION ---
        if (!chatHistories.has(userId)) {
            chatHistories.set(userId, [
                { role: "system", content: context }
            ]);
            
            // Mark as no longer "first time" after the first intro
            if (profile.special_notes === "First time messaging") {
                profile.special_notes = "Regular contact";
                await supabase.from('user_profiles').update({ special_notes: "Regular contact" }).eq('id', profile.id);
            }
        }

        const userHistory = chatHistories.get(userId);
        userHistory[0] = { role: "system", content: context };
        
        let respondWithVoice = false;

        // --- PHASE 1: MEDIA HANDLING (IMAGES & PDFS) ---
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
                    // Phase 2: Hearing (Speech-to-Text)
                    respondWithVoice = true; // Auto-reply with voice if they sent a voice note
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
            userHistory.push({ role: "user", content: messageContent });
        }

        // Check if any message in history contains image content
        const hasImageContent = userHistory.some(msg => 
            Array.isArray(msg.content) && msg.content.some(c => c.type === "image_url")
        );

        // Use vision-capable model when images are present
        let modelToUse;
        if (hasImageContent) {
            modelToUse = "google/gemini-2.0-flash";  // Vision-capable model
        } else {
            modelToUse = "google/gemini-2.5-flash";
        }

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
            }
        ];

        let responseText;
        try {
            const completion = await openai.chat.completions.create({
                model: modelToUse, 
                messages: userHistory,
                max_tokens: 1000,
                tools: tools,
                tool_choice: "auto"
            });
            
            const responseMessage = completion.choices[0].message;
            
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                userHistory.push(responseMessage); // Add the assistant's tool call message
                
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
                
                // Get the final response from the model after tool execution
                const finalCompletion = await openai.chat.completions.create({
                    model: modelToUse,
                    messages: userHistory,
                    max_tokens: 1000
                });
                
                responseText = finalCompletion.choices[0].message.content;
            } else {
                responseText = responseMessage.content;
            }
            
        } catch (visionError) {
            // Fallback: if vision model also fails, strip images and retry with text model
            if (hasImageContent) {
                console.log("Vision model failed, falling back to text-only...");
                const textOnlyHistory = userHistory.map(msg => {
                    if (Array.isArray(msg.content)) {
                        const textParts = msg.content.filter(c => c.type === "text").map(c => c.text);
                        return { role: msg.role, content: textParts.join("\n") + "\n[User sent a photo but I can't see it right now]" };
                    }
                    return msg;
                });
                const fallbackCompletion = await openai.chat.completions.create({
                    model: "google/gemini-2.5-flash",
                    messages: textOnlyHistory,
                    max_tokens: 1000,
                    tools: tools,
                    tool_choice: "auto"
                });
                const fallbackMessage = fallbackCompletion.choices[0].message;
                responseText = fallbackMessage.content || "I processed that, but I can't see images right now.";
                // (Note: To keep this simple, we aren't executing tools on the fallback path, just text response)
            } else {
                throw visionError; // Re-throw if it's not an image issue
            }
        }

        if (isGroup && responseText.trim() === '[IGNORE]') {
            // Remove the user message from history so the bot's memory doesn't get flooded with ignored group chatter
            userHistory.pop(); 
            return; // Stay completely silent
        }

        userHistory.push({ role: "assistant", content: responseText });
        if (userHistory.length > 15) userHistory.splice(1, 4);

        // Send reply with fallback for detached frame errors
        try {
            await msg.reply(responseText);
        } catch (sendErr) {
            console.log("msg.reply failed, trying client.sendMessage fallback...");
            try {
                await client.sendMessage(msg.from, responseText);
            } catch (fallbackErr) {
                console.error("Both reply methods failed:", fallbackErr.message);
            }
        }

        // --- PHASE 3: SPEAKING (TEXT-TO-SPEECH) ---
        if (respondWithVoice) {
            const replyAudioPath = `./temp_reply_${Date.now()}.mp3`;
            
            if (process.env.ELEVENLABS_API_KEY) {
                // ElevenLabs "Jarvis" Voice
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
                            model_id: "eleven_multilingual_v2", // using v2 model
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
                // Fallback to Free Google TTS
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

        // Update DB Metrics
        profile.total_messages = (profile.total_messages || 0) + 1;
        profile.last_interaction = new Date().toISOString();
        await supabase.from('user_profiles').update({
            total_messages: profile.total_messages,
            last_interaction: profile.last_interaction
        }).eq('id', profile.id);

    } catch (error) {
        console.error("Nexa System Error:", error);
    }
});

// --- GRACEFUL SHUTDOWN (Prevents Puppeteer zombie processes on nodemon restart) ---
process.on('SIGINT', async () => {
    console.log('(SIGINT) Shutting down Nexa...');
    await client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('(SIGTERM) Shutting down Nexa...');
    await client.destroy();
    process.exit(0);
});

// For nodemon specifically
process.once('SIGUSR2', async () => {
    console.log('(SIGUSR2) nodemon restarting...');
    await client.destroy();
    process.kill(process.pid, 'SIGUSR2');
});

// For unexpected crashes
process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    await client.destroy();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await client.destroy();
    process.exit(1);
});

client.initialize();