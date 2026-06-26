const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require('dotenv').config();
const express = require("express");
const apiRouter = require("./routes/api");
const { client, startClient, startWatchdog } = require("./config/whatsapp");
const { supabase } = require("./config/supabase");
const { handleMessage } = require("./controllers/whatsappController");
const schedulerService = require("./services/schedulerService");
const aiToolsService = require("./services/aiToolsService");
const qrcode = require("qrcode-terminal");

const app = express();

// Register the modular API routes
app.use(apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web API listening on port ${PORT} 🌐`);
});

// Bind WhatsApp client event listeners
client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("Nexa: Scan the QR code to sync WhatsApp.");
});

client.on("ready", () => {
    console.log("Nexa Personal Assistant is Online and Ready 🚀");
    schedulerService.initScheduler(client, supabase);
    console.log("Automation Scheduler active.");
    startWatchdog();
    aiToolsService.loadAndScheduleReminders(supabase, client);
});

client.on("message", async (msg) => {
    await handleMessage(client, msg);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
    console.log(`\n[${signal}] Shutting down gracefully...`);
    try {
        if (client) {
            await client.destroy();
            console.log('WhatsApp client destroyed.');
        }
    } catch (e) {
        console.error('Error destroying client:', e);
    }
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.once('SIGUSR2', async () => {
    console.log('(SIGUSR2) nodemon restarting...');
    try {
        await client.destroy();
    } catch (e) {}
    process.kill(process.pid, 'SIGUSR2');
});

// Start the client connection
startClient();