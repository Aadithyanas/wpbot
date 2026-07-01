"use client";

import React, { useState } from "react";
import { Coffee, Briefcase, Zap, Heart, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function About() {
  const [activeMode, setActiveMode] = useState<"chill" | "executive">("chill");

  return (
    <section id="about" className="py-24 relative overflow-hidden bg-zinc-950/40">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-red-950/5 blur-[90px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-xs font-bold tracking-widest text-red-500 uppercase mb-3">
            About Nexa AI
          </h2>
          <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-6">
            A Double Agent in Your Pocket
          </h3>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Nexa is a tailored WhatsApp artificial intelligence trained with an organic, human-centric Malayalam-English (Manglish) personality. Operating continuously in the background, it coordinates scheduling, takes messages, and controls IoT nodes.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-12 items-center">
          {/* Left Panel: Description and Modes selection */}
          <div className="md:col-span-6 space-y-6">
            <h4 className="font-heading text-xl font-bold text-white mb-4">
              Dual-Personality Orchestration
            </h4>
            <p className="text-zinc-400 leading-relaxed">
              Unlike generic, rigid AI agents that start every sentence with "As an AI model...", Nexa features a dynamic persona router. It automatically adjusts its linguistic tone and utility set based on who is asking and what they need.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <button
                onClick={() => setActiveMode("chill")}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                  activeMode === "chill"
                    ? "bg-red-950/20 border-red-500/30 shadow-md shadow-red-950/10"
                    : "bg-transparent border-zinc-900 hover:border-zinc-800"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    activeMode === "chill"
                      ? "bg-red-500/20 text-red-500"
                      : "bg-zinc-900 text-zinc-500"
                  }`}
                >
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-heading text-sm font-bold text-white">
                    Mode 1: Default Chill Mode
                  </h5>
                  <p className="text-xs text-zinc-500 mt-1">
                    Organic, short replies. Uses Manglish conversational styles, acts as a supportive buddy, and conveys notifications directly to you.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveMode("executive")}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                  activeMode === "executive"
                    ? "bg-red-950/20 border-red-500/30 shadow-md shadow-red-950/10"
                    : "bg-transparent border-zinc-900 hover:border-zinc-800"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    activeMode === "executive"
                      ? "bg-red-500/20 text-red-500"
                      : "bg-zinc-900 text-zinc-500"
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-heading text-sm font-bold text-white">
                    Mode 2: Executive Business Manager
                  </h5>
                  <p className="text-xs text-zinc-500 mt-1">
                    Polished business communicator. Triggered by meeting bookings or commercial requests. Autonomously accesses Google Calendar and Sheets.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Right Panel: Interactive Mode Preview Screen */}
          <div className="md:col-span-6">
            <div className="glass-panel p-6 rounded-2xl glow-card-red bg-zinc-950/60 flex flex-col min-h-[320px] justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full"></div>
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-950 flex items-center justify-center font-bold text-red-500 border border-red-500/20">
                    NX
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Nexa Engine</h5>
                    <p className="text-[10px] text-zinc-500">
                      Active: {activeMode === "chill" ? "Chill Chat Core" : "Executive Logic Matrix"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/30 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  {activeMode === "chill" ? "Malayalam-Eng Mix" : "Google Cloud Synced"}
                </div>
              </div>

              {/* Chat Simulator Canvas */}
              <div className="flex-1 space-y-4 py-2">
                <AnimatePresence mode="wait">
                  {activeMode === "chill" ? (
                    <motion.div
                      key="chill-chat"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      <div className="flex gap-2.5 max-w-[85%]">
                        <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500 self-end">U</div>
                        <div className="bg-zinc-900 text-zinc-200 text-xs rounded-xl rounded-bl-none px-3 py-2">
                          nexa aara nee? entha cheyya?
                        </div>
                      </div>
                      <div className="flex gap-2.5 max-w-[85%] self-end justify-end ml-auto">
                        <div className="bg-red-600 text-white text-xs rounded-xl rounded-br-none px-3 py-2">
                          Nexa aanu, your personal AI assistant! Pinne oru buddy-yum. ippolum learning stage-il aanu, so bear with me! enthelum parayaan undel njan convey cheyyam 😉
                        </div>
                        <div className="w-6 h-6 rounded-full bg-red-950 flex items-center justify-center text-[10px] text-red-500 self-end font-bold">N</div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="executive-chat"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      <div className="flex gap-2.5 max-w-[85%]">
                        <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500 self-end">U</div>
                        <div className="bg-zinc-900 text-zinc-200 text-xs rounded-xl rounded-bl-none px-3 py-2">
                          I would like to book a meeting regarding a potential partnership.
                        </div>
                      </div>
                      <div className="flex gap-2.5 max-w-[85%] self-end justify-end ml-auto">
                        <div className="bg-red-600 text-white text-xs rounded-xl rounded-br-none px-3 py-2">
                          Certainly. I can check the calendar. Let me look up available slots... I see tomorrow at 3:00 PM IST is free. Would you like to secure this appointment?
                        </div>
                        <div className="w-6 h-6 rounded-full bg-red-950 flex items-center justify-center text-[10px] text-red-500 self-end font-bold">N</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Persona Footer Summary */}
              <div className="border-t border-zinc-900 pt-4 mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Zap className="w-3.5 h-3.5 text-red-500" />
                  <span>State: Auto-Switching</span>
                </div>
                <div className="text-zinc-500">
                  Ref: <span className="text-zinc-300 font-mono">controllers/whatsappController.js</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
