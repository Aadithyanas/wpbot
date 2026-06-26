const path = require("path");
const fs = require("fs");

const STATE_FILE = path.join(__dirname, "../bot_state.json");

let isBotPaused = false;

try {
    if (fs.existsSync(STATE_FILE)) {
        const savedState = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        isBotPaused = !!savedState.isBotPaused;
        console.log(`[STATE] Loaded initial bot state: isBotPaused = ${isBotPaused}`);
    }
} catch (e) {
    console.error("Failed to load initial bot state:", e.message);
}

const getBotPaused = () => isBotPaused;
const setBotPaused = (paused) => {
    isBotPaused = paused;
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify({ isBotPaused }), "utf8");
        console.log(`[STATE] Saved bot state: isBotPaused = ${isBotPaused}`);
    } catch (e) {
        console.error("Failed to save bot state:", e.message);
    }
};

module.exports = {
    getBotPaused,
    setBotPaused
};
