const { OpenAI } = require("openai");
require("dotenv").config();

class AIClient {
    constructor() {
        // Load all available keys from environment variables
        this.keys = [];
        if (process.env.OPENROUTER_API_KEY_1) this.keys.push(process.env.OPENROUTER_API_KEY_1);
        if (process.env.OPENROUTER_API_KEY_2) this.keys.push(process.env.OPENROUTER_API_KEY_2);
        if (process.env.OPENROUTER_API_KEY_3) this.keys.push(process.env.OPENROUTER_API_KEY_3);
        
        // Fallback for old single key format if they didn't update .env properly
        if (this.keys.length === 0 && process.env.OPENROUTER_API_KEY) {
            this.keys.push(process.env.OPENROUTER_API_KEY);
        }

        if (this.keys.length === 0) {
            console.error("No OpenRouter API Keys found in .env!");
        }

        this.currentKeyIndex = 0;
        this.client = this.createClient(this.keys[this.currentKeyIndex]);
    }

    createClient(apiKey) {
        return new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
        });
    }

    rotateKey() {
        if (this.keys.length <= 1) {
            console.log(`[AI-ROTATION] Only 1 key available, cannot rotate.`);
            return false;
        }

        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        console.log(`[AI-ROTATION] Switching to API Key #${this.currentKeyIndex + 1}`);
        this.client = this.createClient(this.keys[this.currentKeyIndex]);
        return true;
    }

    async generate(options) {
        let attempts = 0;
        const maxAttempts = this.keys.length;

        while (attempts < maxAttempts) {
            try {
                const response = await this.client.chat.completions.create(options);
                return response;
            } catch (error) {
                attempts++;
                
                // Check if it's a 402 (Payment Required) or 429 (Rate Limit)
                const status = error.status || error.code;
                if (status === 402 || status === 429) {
                    console.log(`[AI-ROTATION] Encountered Error ${status} on Key #${this.currentKeyIndex + 1}.`);
                    const rotated = this.rotateKey();
                    if (!rotated || attempts >= maxAttempts) {
                        throw error; // Give up if no more keys
                    }
                    console.log(`[AI-ROTATION] Retrying request with new key...`);
                    // The loop will continue and try again
                } else {
                    // If it's a different error (e.g. 500, network error), throw it normally
                    throw error;
                }
            }
        }
        throw new Error("All AI API keys failed.");
    }

    async embed(options) {
        let attempts = 0;
        const maxAttempts = this.keys.length;

        while (attempts < maxAttempts) {
            try {
                const response = await this.client.embeddings.create(options);
                return response;
            } catch (error) {
                attempts++;
                
                // Check if it's a 402 (Payment Required) or 429 (Rate Limit)
                const status = error.status || error.code;
                if (status === 402 || status === 429) {
                    console.log(`[AI-ROTATION-EMBED] Encountered Error ${status} on Key #${this.currentKeyIndex + 1}.`);
                    const rotated = this.rotateKey();
                    if (!rotated || attempts >= maxAttempts) {
                        throw error;
                    }
                    console.log(`[AI-ROTATION-EMBED] Retrying request with new key...`);
                } else {
                    throw error;
                }
            }
        }
        throw new Error("All AI API keys failed for embeddings.");
    }
}

// Export a singleton instance
const aiClient = new AIClient();
module.exports = { aiClient };
