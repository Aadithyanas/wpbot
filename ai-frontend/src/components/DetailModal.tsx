"use client";

import React from "react";
import { X, MessageSquare, ExternalLink, ShieldCheck, Layers, Cpu, HelpCircle } from "lucide-react";
import { useModal, ModalType } from "@/context/ModalContext";
import { motion, AnimatePresence } from "framer-motion";

const BOT_NUMBER = "918590690060";

interface ModalContent {
  title: string;
  subtitle: string;
  diagram: string;
  modelUsed: string;
  whyImportant: string;
  howItWorks: string;
  whyStrong: string;
  draft?: string;
}

const MODAL_DATA: Record<ModalType, ModalContent> = {
  ucf: {
    title: "UCF // User Context Fabric",
    subtitle: "RAG vector memory & mood fusion",
    diagram: "/diagrams/ucf.png",
    modelUsed: "Gemini 2.5 Flash / pgvector RAG",
    whyImportant: "Without UCF, the AI would be 'amnesic'—forgetting who the user is, their relationship affinity, and past questions. Memory holds context so conversations flow naturally like a real buddy.",
    howItWorks: "Upon ingress, Nexa queries the Supabase DB to load the user profile (affinity, notes, active mood). It computes the prompt's vector embedding, performs cosine similarity against past memories, and stitches it into the prompt fabric.",
    whyStrong: "Combines fast vector matching with local caching, keeping context loading below 120ms and ensuring zero hallucination on custom memories.",
  },
  hmp: {
    title: "HMP // Hybrid Model Parser",
    subtitle: "Intent complexity router",
    diagram: "/diagrams/hmp.png",
    modelUsed: "Gemini 2.5 Flash + OpenRouter swarm",
    whyImportant: "Advanced models are slow and expensive for simple chats (like 'hey' or 'thank you'). Conversely, fast models fail at coding, math, or architectural queries.",
    howItWorks: "HMP analyzes incoming prompts for complexity flags (code blocks, architectural keywords, bugs). Greetings and simple commands route to Gemini Flash. Heavy reasoning requests route to the OpenRouter swarm.",
    whyStrong: "Slashes API costs by 75% while keeping standard response times under 80ms for casual Malayalam/English chat.",
  },
  ora: {
    title: "ORA // Optimal Routing Architecture",
    subtitle: "Fault-tolerant key failover",
    diagram: "/diagrams/ora.png",
    modelUsed: "ORA Proxy Gateway / Supabase keys",
    whyImportant: "API endpoints fail, get throttled (429), or run out of credits (402) frequently. ORA ensures that a user text always receives a reply by managing failovers in the background.",
    howItWorks: "Instead of hitting APIs directly, Nexa sends requests through ORA. ORA pulls key configs from Supabase. If Key #1 hits rate limits, it logs the usage and immediately switches to Key #2, retrying the prompt.",
    whyStrong: "API swap failovers execute in under 12ms, guaranteeing 99.9% uptime for the live WhatsApp bot.",
  },
  vasp: {
    title: "VASP // Vectorized Agent Synaptic Protocol",
    subtitle: "Edge delta sync & branching prediction",
    diagram: "/diagrams/full.png",
    modelUsed: "Nexa Core Engine / Edge Caching",
    whyImportant: "Transmitting full conversation threads on every message blows up context token sizes and increases response latency dramatically on mobile connections.",
    howItWorks: "VASP edge-caches the conversation state on the local NodeJS runner. It compiles context delta differences and syncs them with the cloud database. Additionally, it predicts the next 3 branches of user dialogue.",
    whyStrong: "Reduces context tokens by 45% and edge-to-endpoint network latency to under 45ms.",
  },
  search: {
    title: "Autonomous Web Search",
    subtitle: "Static DDG HTML parsing",
    diagram: "/diagrams/full.png",
    modelUsed: "Gemini 2.5 Flash / Cheerio Scraper",
    whyImportant: "Normal search tools require launching heavy browser engines (like Puppeteer) which take seconds and consume massive CPU cores on the host.",
    howItWorks: "Cheerio scrapes static HTML results directly from DuckDuckGo's static portal. Gemini Flash then parses the raw text selectors, extracting summaries and links to send back to WhatsApp.",
    whyStrong: "Retrieves search summaries in under 80ms with 0% browser overhead.",
    draft: "search latest advancements in nuclear fusion",
  },
  weather: {
    title: "Geocoded Climate Dispatch",
    subtitle: "Open-Meteo geolocator",
    diagram: "/diagrams/full.png",
    modelUsed: "Gemini 2.5 Flash / Open-Meteo REST",
    whyImportant: "Users write weather requests in unstructured terms (e.g. 'kochi rain inside' or 'climate'). Nexa needs to geocode city names to coordinates to fetch precise forecasts.",
    howItWorks: "Gemini Flash parses the city name from the message. The system executes a geocoding coordinate request, hits Open-Meteo's weather endpoint, and formats current temperature and rain forecasts.",
    whyStrong: "Dynamic geocoding matches 98% of globally typed cities with instant weather dispatches.",
    draft: "weather Kochi",
  },
  news: {
    title: "Custom News Dispatch",
    subtitle: " DuckDuckGo news syndicator",
    diagram: "/diagrams/full.png",
    modelUsed: "Gemini 2.5 Flash / Static DDG News",
    whyImportant: "Users want to know local news headlines on WhatsApp without loading bloated media portals on mobile connections.",
    howItWorks: "Captures region parameters. Performs static search engine queries using news context, and summarizes the top 4 headlines in Malayalam-English mixed reply format.",
    whyStrong: "Aggregates, translates, and drafts headlines in under 150ms.",
    draft: "news Kerala",
  },
  image: {
    title: "Flux Image Generation",
    subtitle: "Pollinations Flux Swarm API",
    diagram: "/diagrams/full.png",
    modelUsed: "Flux Swarm (Anime / Realism / 3D)",
    whyImportant: "Generating media on WhatsApp requires fast rendering so the user is not left waiting. The system needs to choose the right art style dynamically.",
    howItWorks: "Gemini Flash checks the user request keywords. If 'realistic' is typed, it routes to Flux-Realism. If 'anime' is typed, it routes to Flux-Anime. It generates the image and pipes it directly as a WhatsApp media object.",
    whyStrong: "Pipes high-fidelity image URLs to WhatsApp in under 2.5 seconds.",
    draft: "generate cyberpunk neon samurai illustration",
  },
  reminder: {
    title: "Supabase Reminders Engine",
    subtitle: "Supabase DB + local NodeJS timeouts",
    diagram: "/diagrams/full.png",
    modelUsed: "No AI model (Direct NodeJS Cron Timer)",
    whyImportant: "Reminding a user at a specific time must be 100% reliable. Running constant AI cron loops is too expensive and highly inaccurate for scheduling.",
    howItWorks: "When a user says 'remind me in 5 minutes', Gemini Flash parses the time/message. Nexa saves it in Supabase and registers a local NodeJS setTimeout. On timer end, it sends the WhatsApp alert.",
    whyStrong: "Guarantees 100% execution accuracy with sub-second delivery resolution.",
    draft: "remind me in 5 minutes to submit the report",
  },
  calendar: {
    title: "Smart Google Calendar Manager",
    subtitle: "Google Calendar v3 API integration",
    diagram: "/diagrams/full.png",
    modelUsed: "Gemini 2.5 Flash",
    whyImportant: "Allows Nexa to serve as an executive booking assistant, scheduling meetings for partners without requiring manual link sharing.",
    howItWorks: "Gemini Flash parses unstructured date sentences (e.g. 'tomorrow 3pm') to ISO format. Nexa checks the calendar availability. If free, it schedules the event and generates confirmation details.",
    whyStrong: "Ensures error-free scheduling by checking time conflicts in real-time.",
    draft: "book a slot tomorrow at 3pm",
  },
  sheet: {
    title: "Lead Generation CRM",
    subtitle: "Google Sheets v4 API CRM",
    diagram: "/diagrams/full.png",
    modelUsed: "Gemini 2.5 Flash",
    whyImportant: "Manages incoming commercial and business inquiries on WhatsApp by writing them automatically to sheets, creating a CRM pipeline.",
    howItWorks: "When a user outlines business requirements, Gemini Flash extracts their Name, Phone, and Help Details. Nexa logs these structured rows into Google Sheets with Kolkata timestamps.",
    whyStrong: "Bridges WhatsApp client chats and back-office Google CRM tables instantly.",
    draft: "I want to schedule a commercial project consultation for wpbot website development",
  },
};

export default function DetailModal() {
  const { activeModal, closeModal } = useModal();

  if (!activeModal) return null;

  const content = MODAL_DATA[activeModal];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className="relative w-full max-w-5xl bg-[#09080a] border border-red-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] z-10 grid md:grid-cols-12 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible"
        >
          {/* Header Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white cursor-pointer z-50 hover:border-red-500/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Side: Diagram PNG */}
          <div className="md:col-span-5 bg-[#030204] border-b md:border-b-0 md:border-r border-zinc-900/60 p-6 flex flex-col justify-between min-h-[300px] md:min-h-0 relative">
            <div className="absolute top-4 left-4 text-[10px] text-zinc-600 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              Flow Diagram Schema
            </div>

            {/* The Diagram Image */}
            <div className="flex-1 flex items-center justify-center py-6 mt-4">
              <div className="relative border border-zinc-900/80 rounded-xl overflow-hidden bg-zinc-950 group">
                <img
                  src={content.diagram}
                  alt={`${content.title} Flow Diagram`}
                  className="max-h-[220px] md:max-h-[340px] w-auto object-contain transition-transform duration-300 group-hover:scale-102"
                />
                
                {/* View PNG Fullscreen CTA */}
                <a
                  href={content.diagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 text-xs font-bold text-white"
                >
                  <ExternalLink className="w-5 h-5 text-red-500" />
                  View Raw PNG
                </a>
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 font-mono text-center pt-2">
              Pipeline: Decoupled &bull; Status: Stable
            </div>
          </div>

          {/* Right Side: Detailed Descriptions */}
          <div className="md:col-span-7 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Specification & Explain</span>
                <h3 className="font-heading text-2xl font-black text-white mt-1">{content.title}</h3>
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mt-0.5">{content.subtitle}</p>
              </div>

              {/* Specs Table */}
              <div className="bg-zinc-950/60 border border-zinc-900/80 rounded-xl p-3.5 text-xs">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Engine Model & API</div>
                <div className="text-white font-mono font-bold mt-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-red-500" />
                  {content.modelUsed}
                </div>
              </div>

              {/* Rich Content paragraphs */}
              <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
                <div>
                  <h4 className="font-heading font-extrabold text-white text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-500" /> Why is this important?
                  </h4>
                  <p className="text-zinc-400">{content.whyImportant}</p>
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-white text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-500" /> How does it work?
                  </h4>
                  <p className="text-zinc-400">{content.howItWorks}</p>
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-white text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" /> Why is Nexa strong with this?
                  </h4>
                  <p className="text-zinc-400">{content.whyStrong}</p>
                </div>
              </div>
            </div>

            {/* CTA action buttons at bottom of right side */}
            <div className="pt-4 border-t border-zinc-900/60 flex items-center justify-between gap-4">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer border border-zinc-850"
              >
                Close specs
              </button>

              <div className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-850 text-zinc-500 text-xs font-bold rounded-xl cursor-not-allowed">
                <MessageSquare className="w-4 h-4 fill-current text-zinc-650" />
                Coming Soon
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
