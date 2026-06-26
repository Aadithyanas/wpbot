# Nexa: Advanced WhatsApp Personal Assistant Bot

Nexa is a highly capable personal assistant bot for WhatsApp built on Node.js using `whatsapp-web.js` and Gemini AI. It features a modular MVC/Factory design, persistent memory with vector search, automated scheduling, and real-time tools integration—all running completely on free APIs.

---

## 🚀 Key Features

* **🧠 Dynamic Memory & RAG:** Learns and stores facts about users automatically using Supabase PGVector. It queries these memories using cosine similarity to provide personalized responses.
* **📄 PDF RAG Pipeline:** Extracted text from uploaded PDF documents is automatically chunked, embedded via `text-embedding-3-small`, and stored. Users can then ask detailed questions about the document, and only the most relevant passages are fed to the model context.
* **🖼️ AI Image Generation:** Generate images on-demand using Pollinations.ai (Flux-3D) directly in chat.
* **🌤️ Live Climate Reports:** Fetches real-time weather and forecast data (temperature, feels-like, wind speed, precipitation, humidity) via the Open-Meteo API.
* **⏰ Contextual Reminders:** Schedule reminders dynamically (e.g. "Remind me to drink water in 10 minutes"). Reminders are persisted in Supabase and rescheduled automatically if the bot restarts.
* **🔍 Web & News Search:** Scrapes DuckDuckGo search results to answer questions requiring real-time info or local news without API keys.
* **📅 Automated Scheduler:** Sends personalized morning (9:00 AM) and evening (10:30 PM) greetings to a prioritized list of contacts, automatically skipping contacts with recent active conversations.
* **🌐 Express Control API:** Endpoints to check current page screenshot (`/api/secret/screenshot`), pause/resume the bot (`/api/secret/stop` & `/api/secret/start`), and host a stable offline WhatsApp Web version cache.
* **🛡️ Connection Watchdog:** Active 5-minute watchdog ping to prevent browser sleep, dynamic state conflict recovery, and automated zombie Chrome process cleanup on start.

---

## 🛠️ Refactored Modular Architecture

The project has been refactored into a clean MVC/Factory-like directory structure:

```text
ai-agent/
│
├── config/
│   ├── appState.js          # Persistent pause/resume state management (bot_state.json)
│   ├── supabase.js          # Supabase database client and exception handlers
│   ├── ai.js                # Groq and OpenRouter AI Clients setup
│   └── whatsapp.js          # Puppeteer options and WhatsApp Client initialization
│
├── routes/
│   └── api.js               # Express API endpoints (/api/secret/...)
│
├── models/
│   ├── state.js             # In-memory session caches (chat histories, rate limits)
│   ├── userProfile.js       # Supabase query helpers for user profiles & affinity
│   └── memory.js            # DB query helpers for memory embeddings & PDF RAG chunks
│
├── controllers/
│   └── whatsappController.js # Handles all message events, media processing, and AI tool routing
│
├── services/
│   ├── googleService.js     # Google Calendar integration proxy
│   ├── schedulerService.js  # Node-cron automated greetings scheduler
│   └── aiToolsService.js    # Decoupled weather, news, search, image, & reminders actions
│
└── server.js                # Minimal application entry point and bootstrapper
```

---

## 💡 How to Test & Try Features

Once the bot is running and connected, try sending it the following messages:

### 1. 🌤️ Weather / Climate Reports
Ask about the weather in any location:
* `"What's the weather in Kochi?"`
* `"Tell me the climate in New York"`

### 2. 🖼️ AI Image Generation
Ask the bot to generate/draw an image by using keywords like "draw", "generate", or "image":
* `"Draw a futuristic cyberpunk garage with a neon sports car"`
* `"Generate an image of a cute kitten playing with yarn"`

### 3. ⏰ Reminders
Set a reminder for a duration or specific time:
* `"Remind me in 5 minutes to stretch"`
* `"Set a reminder at 11:30 PM to drink water"`

### 4. 📄 PDF Document Q&A
1. Upload a PDF file to the chat.
2. The bot will confirm: *"I have processed your PDF document..."*
3. Ask questions about the content of that specific PDF.

### 5. 🔍 Web Search & News
Ask questions requiring search engine lookups or local news:
* `"What is the latest news in Kerala?"`
* `"Who won the game yesterday?"`

### 6. 📅 Automated Greetings (Scheduler)
The scheduler automatically targets numbers configured in the `.env` file for daily check-ins.

---

## ⚙️ Setup & Installation

### 1. Install Dependencies
```bash
cd ai-agent
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `ai-agent` directory with the following variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
OPENROUTER_API_KEY_1=your-openrouter-key
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
NEONITRIX_GROUP_ID=your-group-id@g.us
STATIC_PRIORITY_NUMBERS=num1,num2,num3
```

### 3. Start the Bot
```bash
npm start
```
Scan the QR code printed in the terminal with your WhatsApp application.
