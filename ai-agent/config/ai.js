const { OpenAI } = require("openai");
const { aiClient } = require("../ai_client");
require("dotenv").config();

const groqSTT = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "MISSING_KEY",
});

module.exports = {
    aiClient,
    groqSTT
};
