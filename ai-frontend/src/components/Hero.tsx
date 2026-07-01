"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ArrowRight, Play, Check, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  sender: "user" | "nexa";
  text: string;
  time: string;
  status?: "sent" | "read";
}

const CHAT_SEQUENCE: ChatMessage[][] = [
  [
    { sender: "user", text: "hey nexa", time: "10:14 AM" },
    { sender: "nexa", text: "heyyy tell me! entha vishesham?", time: "10:14 AM" },
  ],
  [
    { sender: "user", text: "who are you?", time: "10:15 AM" },
    { sender: "nexa", text: "I'm Nexa, your WhatsApp AI buddy. ippolum learning stage-il aanu, so bear with me! 😅", time: "10:15 AM" },
  ],
  [
    { sender: "user", text: "can you book a meeting with Amal tomorrow 3pm?", time: "10:16 AM" },
    { sender: "nexa", text: "Let me check... Google Calendar free aanu. Slot booked! 📅 I'll ping you.", time: "10:16 AM" },
  ],
  [
    { sender: "user", text: "generate a cyberpunk city image", time: "10:17 AM" },
    { sender: "nexa", text: "Flux core generating image... 🎨 Here you go: [CyberpunkCity.jpg] Sent!", time: "10:17 AM" },
  ],
];

export default function Hero() {
  const [seqIndex, setSeqIndex] = useState(0);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const runChatAnimation = async () => {
      const currentPair = CHAT_SEQUENCE[seqIndex];
      
      // Clear previous and show user message
      setActiveMessages([]);
      setIsTyping(false);
      
      // Send User Message
      await new Promise(r => timeoutId = setTimeout(r, 1000));
      setActiveMessages([currentPair[0]]);
      
      // Wait, then start typing indicator for Nexa
      await new Promise(r => timeoutId = setTimeout(r, 1200));
      setIsTyping(true);
      
      // Deliver Nexa Message
      await new Promise(r => timeoutId = setTimeout(r, 2000));
      setIsTyping(false);
      setActiveMessages([currentPair[0], { ...currentPair[1], status: "read" }]);
      
      // Wait before moving to next sequence
      await new Promise(r => timeoutId = setTimeout(r, 4500));
      setSeqIndex((prev) => (prev + 1) % CHAT_SEQUENCE.length);
    };

    runChatAnimation();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [seqIndex]);

  return (
    <section className="relative min-h-screen pt-32 pb-16 flex items-center justify-center overflow-hidden">
      {/* Background Cyberpunk Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-red-900/10 blur-[80px] animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-rose-950/10 blur-[100px] animate-pulse-glow"></div>
      
      {/* Moving grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1212_1px,transparent_1px),linear-gradient(to_bottom,#1f1212_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Heading and Context */}
        <div className="md:col-span-7 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/30 border border-red-500/20 text-xs font-semibold text-red-400 mb-6 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" /> Direct WhatsApp Integration
          </div>
          
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 text-glow-red">Nexa AI</span>.
            <br />
            <span className="text-green-500 text-glow-green">WhatsApp's</span> Personal AI.
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            A dual-personality WhatsApp agent that weaves personalized vector memories, routes tasks dynamically across LLMs, and acts as both a chill conversational companion and an executive scheduler.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a
              href="#try-now"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-lg shadow-lg hover:shadow-red-950/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              Initialize Emulator <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#architecture"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-semibold rounded-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white text-white" /> View Protocols
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-3 gap-6 md:gap-12 border-t border-zinc-900 pt-8 w-full">
            <div>
              <div className="font-heading text-3xl font-extrabold text-white">42ms</div>
              <div className="text-zinc-500 text-sm">Edge Latency</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-extrabold text-white">Dual</div>
              <div className="text-zinc-500 text-sm">Personality Engine</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-extrabold text-white">100%</div>
              <div className="text-zinc-500 text-sm">RAG Accuracy</div>
            </div>
          </div>
        </div>

        {/* Right Column: High Fidelity Animated Mobile Mockup */}
        <div className="md:col-span-5 flex justify-center w-full">
          <div className="relative w-full max-w-[340px] aspect-[9/18] bg-zinc-950 rounded-[48px] border-[6px] border-zinc-800 p-2 shadow-[0_0_50px_rgba(239,68,68,0.15)] glow-card-red animate-float">
            {/* Phone Speaker/Camera Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-full z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-black rounded-full mb-1"></div>
            </div>
            
            {/* Inner Phone Content */}
            <div className="w-full h-full bg-[#0a0505] rounded-[40px] overflow-hidden flex flex-col relative">
              {/* WhatsApp Header */}
              <div className="bg-zinc-900/90 border-b border-zinc-850 p-4 pt-8 flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full bg-red-950 border border-red-500/40 flex items-center justify-center font-bold text-red-500">
                  N
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"></span>
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">Nexa AI // Buddy</div>
                  <div className="text-[10px] text-green-500">online</div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 relative">
                <div className="absolute inset-0 bg-[#070303] opacity-60 bg-[radial-gradient(#1f1111_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>

                <AnimatePresence>
                  {activeMessages.map((msg, i) => (
                    <motion.div
                      key={msg.text + i}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={`flex flex-col max-w-[80%] rounded-2xl px-3 py-2 text-xs relative ${
                        msg.sender === "user"
                          ? "bg-red-600 text-white self-end rounded-tr-none"
                          : "bg-zinc-900 text-zinc-200 self-start rounded-tl-none border border-red-500/10"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-zinc-400 self-end mt-1 block">
                        {msg.time}
                        {msg.sender === "user" && (
                          <Check className="inline-block w-3 h-3 ml-1 text-zinc-200" />
                        )}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-zinc-900 text-zinc-400 self-start rounded-2xl rounded-tl-none px-3 py-2 border border-red-500/10 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-150"></span>
                  </motion.div>
                )}
              </div>

              {/* Chat Input Footer */}
              <div className="bg-zinc-900/90 p-3 border-t border-zinc-850 flex items-center gap-2">
                <div className="flex-1 bg-zinc-950 rounded-full px-3 py-2 text-[10px] text-zinc-500 border border-zinc-800 flex items-center">
                  Message Nexa...
                </div>
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white cursor-pointer hover:bg-red-500 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
