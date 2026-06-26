const express = require("express");
const path = require("path");
const router = express.Router();
const appState = require("../config/appState");
const { client } = require("../config/whatsapp");

// Serve the stable WhatsApp Web payload locally to bypass GitHub timeouts
router.get('/wa-version.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../wa-version.html'));
});

router.get('/api/secret/stop', (req, res) => {
    appState.setBotPaused(true);
    res.send("<h1>🤖 AI Bot is PAUSED</h1><p>You can now chat manually without interference.</p>");
    console.log("🛑 Bot paused via API.");
});

router.get('/api/secret/start', (req, res) => {
    appState.setBotPaused(false);
    res.send("<h1>🚀 AI Bot is RESUMED</h1><p>Nexa is active again.</p>");
    console.log("▶️ Bot resumed via API.");
});

router.get('/api/secret/screenshot', async (req, res) => {
    try {
        if (!client || !client.pupPage) {
            return res.status(500).send("Client or page not initialized.");
        }
        const screenshotBuffer = await client.pupPage.screenshot({ type: 'png' });
        res.setHeader('Content-Type', 'image/png');
        res.send(screenshotBuffer);
    } catch (e) {
        res.status(500).send("Error taking screenshot: " + e.message);
    }
});

module.exports = router;
