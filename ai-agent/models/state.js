const chatHistories = new Map();
const userRateLimits = new Map();
const stoppedChats = new Set();

module.exports = {
    chatHistories,
    userRateLimits,
    stoppedChats
};
