"use client";

import React from "react";
import { Cpu, Terminal } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-900 py-12 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-8 items-center">
        {/* Logo and Tagline */}
        <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          <a href="#" className="flex items-center gap-2.5 group cursor-pointer mr-2 shrink-0">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-red-500/20 group-hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all duration-300">
              <NexaLogoIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start justify-center">
              <div className="flex items-baseline font-sans font-black text-sm tracking-[0.12em] text-white leading-none">
                <span>NEXA</span>
                <span className="text-red-500 font-bold tracking-tighter mx-0.5">//</span>
                <span className="text-zinc-100 font-bold text-xs tracking-normal">AI</span>
              </div>
              <span className="text-[8px] text-zinc-500 font-mono tracking-widest mt-1 leading-none uppercase">Personal Engine</span>
            </div>
          </a>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
            Nexa AI is a highly autonomous WhatsApp personal AI orchestrator. Designed for context-aware memory fusion, Google Cloud integrations, and low-latency edge synchronizations.
          </p>
        </div>

        {/* Tech Badges */}
        <div className="md:col-span-4 flex flex-wrap justify-center md:justify-start gap-2.5">
          {["Next.js 16", "Tailwind CSS v4", "TypeScript", "Supabase DB", "Google APIs"].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-full text-[10px] text-zinc-400 font-medium font-mono"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Copyright & Social */}
        <div className="md:col-span-2 flex flex-col items-center md:items-end gap-3 text-center md:text-right">
          <div className="flex gap-4">
            <a href="#" className="text-zinc-500 hover:text-white transition-colors" aria-label="Github link">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors" aria-label="Twitter link">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors" aria-label="Terminal docs link">
              <Terminal className="w-4 h-4" />
            </a>
          </div>
          <span className="text-[10px] text-zinc-600 font-mono">
            &copy; {new Date().getFullYear()} NEXA. WhatsApp's Personal AI.
          </span>
        </div>
      </div>
    </footer>
  );
}

const NexaLogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="stroke-red-500" />
    <line x1="12" y1="2" x2="12" y2="22" className="stroke-red-900 opacity-40" strokeWidth="1" />
    <line x1="2" y1="8.5" x2="22" y2="15.5" className="stroke-red-900 opacity-40" strokeWidth="1" />
    <line x1="2" y1="15.5" x2="22" y2="8.5" className="stroke-red-900 opacity-40" strokeWidth="1" />
    <circle cx="12" cy="12" r="3.5" className="fill-red-600 stroke-none" />
  </svg>
);
