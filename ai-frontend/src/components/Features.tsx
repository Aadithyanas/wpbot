"use client";

import React from "react";
import { Search, CloudRain, Newspaper, Image, Bell, Calendar, Sheet, MessageSquare, Eye } from "lucide-react";
import { useModal, ModalType } from "@/context/ModalContext";

const FEATURES = [
  {
    icon: Search,
    title: "Autonomous Web Search",
    desc: "Bypasses heavy browser automation. Uses Cheerio to parse DuckDuckGo static HTML, returning immediate summaries of search indexes in 80ms.",
    type: "search" as ModalType,
    className: "md:col-span-6 bg-zinc-950/40 border border-zinc-900",
  },
  {
    icon: CloudRain,
    title: "Geocoded Climate Dispatch",
    desc: "Queries Open-Meteo with automated city-level latitude/longitude lookup for real-time weather alerts and daily rain forecasts.",
    type: "weather" as ModalType,
    className: "md:col-span-3 bg-zinc-950/40 border border-zinc-900",
  },
  {
    icon: Newspaper,
    title: "Custom News Dispatch",
    desc: "Combines local region parameters with news query context to fetch up-to-the-minute headlines directly to active chats.",
    type: "news" as ModalType,
    className: "md:col-span-3 bg-zinc-950/40 border border-zinc-900",
  },
  {
    icon: Image,
    title: "Flux Image Generation",
    desc: "Generates high-definition illustrations (supports Flux Realism, Anime, and 3D render models) on the fly via Pollinations.ai API integration.",
    type: "image" as ModalType,
    className: "md:col-span-4 bg-zinc-950/40 border border-zinc-900",
  },
  {
    icon: Bell,
    title: "Supabase Reminders Engine",
    desc: "Persists time-bound reminders in Supabase DB and spawns active local NodeJS timeouts to trigger automated notifications.",
    type: "reminder" as ModalType,
    className: "md:col-span-4 bg-zinc-950/40 border border-zinc-900",
  },
  {
    icon: Calendar,
    title: "Google Calendar Booking",
    desc: "Validates meeting times and schedules direct appointments inside Google Calendar v3 API with automated booking links.",
    type: "calendar" as ModalType,
    className: "md:col-span-4 bg-zinc-950/40 border border-zinc-900",
  },
  {
    icon: Sheet,
    title: "Lead Generation Pipeline",
    desc: "Automatically translates client requirements into structured business leads, writing details directly into Google Sheets.",
    type: "sheet" as ModalType,
    className: "md:col-span-12 bg-zinc-950/40 border border-zinc-900",
  },
];

export default function Features() {
  const { openModal } = useModal();

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-black">
      {/* Background glow grids */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-red-950/5 blur-[80px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-xs font-bold tracking-widest text-red-500 uppercase mb-3">
            Autonomous Capabilities
          </h2>
          <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Equipped with Autonomous Tools
          </h3>
          <p className="text-zinc-400 text-base sm:text-lg mb-4">
            Nexa isn't just a text bot. It acts on the environment through integrated APIs and node libraries, converting simple chat statements into workflows.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-red-400 font-semibold px-4 py-1.5 rounded-full bg-red-950/20 border border-red-500/15">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            Click any feature box below to view diagrams, model logic, and WhatsApp draft instructions!
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {FEATURES.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <button
                key={index}
                onClick={() => openModal(item.type)}
                className={`p-6 rounded-2xl glass-panel relative overflow-hidden group transition-all duration-300 flex flex-col justify-between cursor-pointer hover:scale-[1.01] hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.08)] text-left w-full ${item.className}`}
              >
                {/* Red hover accent shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                
                {/* Top Row: Icon and Action Badge */}
                <div className="flex items-start justify-between w-full mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Action badge */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-500/20 px-2.5 py-1 rounded-full">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Explain Tech</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-heading text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h4>
                  
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
