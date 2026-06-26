const cron = require("node-cron");
const { aiClient } = require("./ai_client");
const fs = require("fs");
require('dotenv').config();

function initScheduler(client, supabase) {

    // LOAD STATIC NUMBERS FROM ENV
    const staticPriorityNumbers = process.env.STATIC_PRIORITY_NUMBERS
        ? process.env.STATIC_PRIORITY_NUMBERS.split(",").map(num => num.trim())
        : [];

    // LOAD STATIC MESSAGES FROM FILES
    let morningMessages = ["Good morning [NAME]! ☀️ Have a great day ahead."];
    let nightMessages = ["Good night [NAME]! 🌙 Sleep well."];
    
    try {
        morningMessages = fs.readFileSync("./morning_greetings.txt", "utf8").split('\n').filter(l => l.trim() !== '');
        nightMessages = fs.readFileSync("./night_greetings.txt", "utf8").split('\n').filter(l => l.trim() !== '');
    } catch (err) {
        console.error("Could not load greeting files. Using defaults.", err.message);
    }

    // --- MORNING WISH (9:00 AM) ---
    cron.schedule('0 9 * * *', async () => {
        console.log("Sending Static Morning Wishes... ☀️");
        await sendStaticWish(client, supabase, staticPriorityNumbers, morningMessages);
    }, { timezone: "Asia/Kolkata" });

    // --- NIGHT WISH (10:30 PM) ---
    cron.schedule('30 22 * * *', async () => {
        console.log("Sending Static Night Wishes... 🌙");
        await sendStaticWish(client, supabase, staticPriorityNumbers, nightMessages);
    }, { timezone: "Asia/Kolkata" });

    // --- PROACTIVE CHECK-IN (2:00 PM) ---
    cron.schedule('0 14 * * *', async () => {
        console.log("Running Proactive Contextual Check-ins... 🧠");
        await sendProactiveCheckins(client, supabase);
    }, { timezone: "Asia/Kolkata" });

    // --- NEONITRIX GROUP EVENING UPDATE (5:30 PM) ---
    cron.schedule('30 17 * * *', async () => {
        console.log("Sending Neonitrix Group Evening Update... 🚀");
        await sendNeonitrixGroupUpdate(client);
    }, { timezone: "Asia/Kolkata" });
}

async function sendStaticWish(client, supabase, numberList, messageList) {
    for (const num of numberList) {
        try {
            const chatId = num.includes("@c.us") ? num : `${num}@c.us`;

            // Find user in DB to check last interaction
            let { data: user } = await supabase.from('user_profiles').select('*').eq('whatsapp_id', chatId).single();

            if (!user) {
                const newUser = {
                    whatsapp_id: chatId,
                    name: "Priority Contact",
                    is_priority: true
                };
                const { data } = await supabase.from('user_profiles').insert(newUser).select().single();
                user = data;
            }

            // SMART CHECK: Skip if you talked to them manually in the last 1 hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (user && user.last_interaction && new Date(user.last_interaction) > oneHourAgo) {
                console.log(`Skipping ${chatId} - Recent manual activity.`);
                continue;
            }

            // Get contact name and pick a random message
            const contact = await client.getContactById(chatId);
            const name = contact.name || contact.pushname || "buddy";
            let textToSend = messageList[Math.floor(Math.random() * messageList.length)];
            textToSend = textToSend.replace(/\[NAME\]/g, name);

            // SEND THE STATIC MESSAGE (No AI call here)
            await client.sendMessage(chatId, textToSend);

            // Update DB timestamp
            if (user) {
                await supabase.from('user_profiles').update({ last_interaction: new Date().toISOString() }).eq('id', user.id);
            }

            console.log(`✅ Message sent to ${chatId}`);

        } catch (err) {
            console.error(`Error sending to ${num}:`, err);
        }
    }
}

async function sendProactiveCheckins(client, supabase) {
    // Find users with affinity > 20 who haven't interacted in the last 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .gt('affinity_score', 20)
        .lt('last_interaction', threeDaysAgo);

    if (error || !users) return;

    for (const user of users) {
        try {
            // Fetch their latest memory
            const { data: memories } = await supabase
                .from('memories')
                .select('*')
                .eq('whatsapp_id', user.whatsapp_id)
                .order('created_at', { ascending: false })
                .limit(1);

            let memoryContext = "";
            if (memories && memories.length > 0) {
                memoryContext = `The last important thing you remember about them is: "${memories[0].memory_text}"`;
            }

            const prompt = `You are Nexa, Aadithyan's AI buddy. 
You haven't spoken to ${user.nickname} in a few days. 
Generate a short, casual, friendly text checking in on them.
${memoryContext}
Keep it to 1-2 sentences. Do NOT sound like a robot. Just be a friend.`;

            const completion = await aiClient.generate({
                model: "google/gemini-2.5-flash",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200
            });

            const textToSend = completion.choices[0].message.content.trim();
            await client.sendMessage(user.whatsapp_id, textToSend);

            // Update interaction time
            await supabase.from('user_profiles').update({ last_interaction: new Date().toISOString() }).eq('id', user.id);
            console.log(`✅ Proactive check-in sent to ${user.whatsapp_id}: ${textToSend}`);

        } catch (err) {
            console.error(`Error sending proactive msg to ${user.whatsapp_id}:`, err);
        }
    }
}

async function sendNeonitrixGroupUpdate(client) {
    const groupId = process.env.NEONITRIX_GROUP_ID;
    if (!groupId) return;

    try {
        const prompt = `You are Nexa, the Admin / Manager of the "Neonitrix" WhatsApp group.
It is evening time. Write a short, highly engaging, fun message to kickstart conversation in the group.
You can:
- Ask how everyone is doing ("chaya kudicho?")
- Tell a quick tech/movie joke
- Drop a cool piece of tech or movie news
- Ask people what skills they are working on today so you can motivate them.
Speak casually in Manglish. Keep it under 3-4 sentences. Do NOT sound like an AI.`;

        const completion = await aiClient.generate({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 250
        });

        const textToSend = completion.choices[0].message.content.trim();
        await client.sendMessage(groupId, textToSend);
        console.log(`✅ Sent Neonitrix Group evening update: ${textToSend}`);
    } catch (err) {
        console.error("Error sending Neonitrix Group update:", err);
    }
}

module.exports = { initScheduler };