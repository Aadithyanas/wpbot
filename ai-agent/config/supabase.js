const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: SUPABASE_URL or SUPABASE_KEY is missing in env!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Traps global unhandled rejections to prevent Puppeteer "Target closed" crashes from terminating the node process
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = {
    supabase
};
