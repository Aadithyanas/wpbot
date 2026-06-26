const cheerio = require("cheerio");
const axios = require("axios");

/**
 * Searches the web using DuckDuckGo's static HTML page.
 * Parses the result using cheerio to extract titles, snippets, and URLs.
 */
async function webSearch(query) {
    console.log(`[DEBUG-TOOL] Performing web search for: "${query}"...`);
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            family: 4
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        const results = [];
        
        $(".web-result").each((index, element) => {
            if (index >= 4) return; // Top 4 results only
            
            const titleEl = $(element).find(".result__a");
            const snippetEl = $(element).find(".result__snippet");
            
            const title = titleEl.text().trim();
            const link = titleEl.attr("href");
            const snippet = snippetEl.text().trim();
            
            if (title && snippet) {
                results.push({ title, snippet, link });
            }
        });
        
        if (results.length === 0) {
            return `No search results found for: "${query}".`;
        }
        
        return results.map((r, i) => `[${i + 1}] Title: ${r.title}\nSnippet: ${r.snippet}\nLink: ${r.link}`).join("\n\n");
    } catch (err) {
        console.error("[DEBUG-TOOL] webSearch error:", err.message || err);
        return `Error performing web search: ${err.message}`;
    }
}

/**
 * Retrieves a detailed weather and climate report from Open-Meteo.
 * Performs geocoding first, then fetches current weather and daily forecasts.
 */
async function getClimateReport(location) {
    console.log(`[DEBUG-TOOL] Fetching climate report for: "${location}"...`);
    try {
        // Step 1: Geocoding
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
        const geoResponse = await axios.get(geocodeUrl, { family: 4 });
        const geoData = geoResponse.data;
        if (!geoData.results || geoData.results.length === 0) {
            return `Could not find location coordinates for: "${location}". Please specify city/state name.`;
        }
        
        const geoResult = geoData.results[0];
        const lat = geoResult.latitude;
        const lon = geoResult.longitude;
        const formattedName = `${geoResult.name}, ${geoResult.admin1 || ''} (${geoResult.country})`;
        
        // Step 2: Weather Forecast
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        const weatherResponse = await axios.get(weatherUrl, { family: 4 });
        const weatherData = weatherResponse.data;
        const current = weatherData.current;
        const daily = weatherData.daily;
        
        // Decode weather codes to descriptions
        const weatherDescriptions = {
            0: "Clear sky ☀️",
            1: "Mainly clear 🌤️", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
            45: "Foggy 🌫️", 48: "Depositing rime fog 🌫️",
            51: "Light drizzle 🌧️", 53: "Moderate drizzle 🌧️", 55: "Dense drizzle 🌧️",
            61: "Slight rain 🌧️", 63: "Moderate rain 🌧️", 65: "Heavy rain 🌧️",
            80: "Slight rain showers 🌦️", 81: "Moderate rain showers 🌦️", 82: "Violent rain showers 🌦️",
            95: "Thunderstorm ⛈️", 96: "Thunderstorm with slight hail ⛈️", 99: "Thunderstorm with heavy hail ⛈️"
        };
        
        const weatherDesc = weatherDescriptions[current.weather_code] || "Unspecified weather";
        
        const report = `🌍 Climate Report for ${formattedName}:
- Current Temperature: ${current.temperature_2m}°C (Feels like ${current.apparent_temperature}°C)
- Condition: ${weatherDesc}
- Humidity: ${current.relative_humidity_2m}%
- Wind Speed: ${current.wind_speed_10m} km/h
- Current Precipitation: ${current.precipitation} mm
- Forecast for Today: Max ${daily.temperature_2m_max[0]}°C, Min ${daily.temperature_2m_min[0]}°C
- Expected Total Rain today: ${daily.precipitation_sum[0]} mm`;
        
        return report;
    } catch (err) {
        console.error("[DEBUG-TOOL] getClimateReport error:", err.message || err);
        return `Error fetching climate report: ${err.message}`;
    }
}

/**
 * Searches and generates regional news reports by utilizing webSearch with news context.
 */
async function getNewsReport(region) {
    console.log(`[DEBUG-TOOL] Fetching news report for: "${region}"...`);
    const query = `${region} news today`;
    const searchResults = await webSearch(query);
    return `📰 Recent News Headlines for ${region}:\n\n${searchResults}`;
}

/**
 * Generates an image using Pollinations.ai and returns the media link.
 */
function getGeneratedImageUrl(prompt) {
    console.log(`[DEBUG-TOOL] Generating image URL for prompt: "${prompt}"...`);
    const lowerPrompt = prompt.toLowerCase();
    let model = "flux";
    
    if (lowerPrompt.includes("realism") || lowerPrompt.includes("realistic") || lowerPrompt.includes("photorealistic") || lowerPrompt.includes("photo") || lowerPrompt.includes("photograph")) {
        model = "flux-realism";
    } else if (lowerPrompt.includes("anime") || lowerPrompt.includes("manga")) {
        model = "flux-anime";
    } else if (lowerPrompt.includes("3d") || lowerPrompt.includes("cgi") || lowerPrompt.includes("pixar") || lowerPrompt.includes("render")) {
        model = "flux-3d";
    }
    
    console.log(`[DEBUG-TOOL] Selected model: "${model}" for prompt.`);
    const cleanPrompt = encodeURIComponent(prompt.trim());
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=${model}`;
}

/**
 * Persists a reminder in Supabase and schedules a timeout.
 */
async function setReminder(whatsappId, message, delayMinutes, supabase, client) {
    console.log(`[DEBUG-TOOL] Setting reminder for ${whatsappId} in ${delayMinutes} minutes: "${message}"...`);
    try {
        const scheduledTime = new Date(Date.now() + delayMinutes * 60 * 1000);
        
        // Save to Supabase
        const { data, error } = await supabase.from('reminders').insert({
            whatsapp_id: whatsappId,
            message: message,
            scheduled_time: scheduledTime.toISOString(),
            is_fired: false
        }).select().single();
        
        if (error) throw error;
        
        // Schedule local timeout
        scheduleLocalTimeout(data, supabase, client);
        
        return `⏰ Reminder successfully set! I will remind you in ${delayMinutes} minute(s): "${message}"`;
    } catch (err) {
        console.error("[DEBUG-TOOL] setReminder error:", err.message || err);
        return `Error setting reminder: ${err.message}`;
    }
}

/**
 * Schedules a local JavaScript timeout to fire the reminder.
 */
function scheduleLocalTimeout(reminder, supabase, client) {
    const delay = new Date(reminder.scheduled_time).getTime() - Date.now();
    if (delay <= 0) {
        fireReminder(reminder, supabase, client);
        return;
    }
    
    setTimeout(() => {
        fireReminder(reminder, supabase, client);
    }, delay);
}

/**
 * Fires the reminder, sends a WhatsApp message, and marks it as fired in Supabase.
 */
async function fireReminder(reminder, supabase, client) {
    try {
        // Double check if already fired in DB to prevent duplicates
        const { data } = await supabase.from('reminders').select('is_fired').eq('id', reminder.id).single();
        if (data && data.is_fired) return;
        
        console.log(`[DEBUG-TOOL] Firing reminder #${reminder.id} to ${reminder.whatsapp_id}...`);
        
        // Send WhatsApp Message
        await client.sendMessage(reminder.whatsapp_id, `🔔 *REMINDER:* ${reminder.message}`);
        
        // Update DB
        await supabase.from('reminders').update({ is_fired: true }).eq('id', reminder.id);
        console.log(`[DEBUG-TOOL] Reminder #${reminder.id} fired successfully.`);
    } catch (err) {
        console.error(`[DEBUG-TOOL] Failed to fire reminder #${reminder.id}:`, err.message || err);
    }
}

/**
 * Loads all unfired reminders from Supabase on startup and schedules them.
 */
async function loadAndScheduleReminders(supabase, client) {
    console.log("[DEBUG-TOOL] Loading pending reminders from Supabase...");
    try {
        const { data: reminders, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('is_fired', false);
            
        if (error) throw error;
        
        console.log(`[DEBUG-TOOL] Found ${reminders.length} pending reminders.`);
        for (const rem of reminders) {
            scheduleLocalTimeout(rem, supabase, client);
        }
    } catch (err) {
        console.error("[DEBUG-TOOL] Failed to load pending reminders:", err.message || err);
    }
}

module.exports = {
    webSearch,
    getClimateReport,
    getNewsReport,
    getGeneratedImageUrl,
    setReminder,
    loadAndScheduleReminders
};
