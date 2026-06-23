const cron = require("node-cron");
require('dotenv').config();

function initScheduler(client, supabase) {
    
    // YOUR 4 STATIC NUMBERS
    const staticPriorityNumbers = [
        "919895600610", 
        "919895265852", 
        "917736008276", 
        "918590647191"
    ];

    // STATIC MESSAGE LIBRARY (Edit these however you like)
    const messages = {
        morning: "Good morning! ☀️ Have a great day ahead.",
        night: "Good night! 🌙 Sleep well."
    };

    // --- MORNING WISH (8:00 AM) ---
    cron.schedule('0 8 * * *', async () => {
        console.log("Sending Static Morning Wishes... ☀️");
        await sendStaticWish(client, supabase, staticPriorityNumbers, messages.morning);
    });

    // --- NIGHT WISH (10:30 PM) ---
    cron.schedule('30 22 * * *', async () => {
        console.log("Sending Static Night Wishes... 🌙");
        await sendStaticWish(client, supabase, staticPriorityNumbers, messages.night);
    });
}

async function sendStaticWish(client, supabase, numberList, textToSend) {
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

module.exports = { initScheduler };