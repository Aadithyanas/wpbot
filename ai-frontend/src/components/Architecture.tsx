"use client";

import React, { useState } from "react";
import { Network, BrainCircuit, Key, RefreshCcw, Layers, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal, ModalType } from "@/context/ModalContext";

export default function Architecture() {
  const [activeTab, setActiveTab] = useState<"ucf" | "hmp" | "ora" | "vasp">("ucf");
  const { openModal } = useModal();

  const techDetails = {
    ucf: {
      title: "UCF // User Context Fabric",
      subtitle: "Dynamic Context Assembler & Memory Weaving",
      desc: "UCF intercept incoming streams, queries the vector embeddings db, and pulls patient/user metadata profiles (affinity scores, active mood, relationship notes). It merges these data points into a cohesive 'Master Fabric' context template, ensuring every response feels highly contextual and remembers previous events.",
      specs: [
        { label: "Storage Engine", val: "Supabase Vector (pgvector)" },
        { label: "Lookup Method", val: "Cosine Similarity Matching" },
        { label: "Context Weft", val: "Profile + Mood + RAG Chunks" },
      ],
      diagram: "User -> UCF Lookup -> Vector DB match -> Context Weave -> Prompt Inject",
    },
    hmp: {
      title: "HMP // Hybrid Model Parser",
      subtitle: "Autonomous Query Routing & Parsing Matrix",
      desc: "HMP acts as the decision gateway. It checks the token length and analyzes the prompt complexity (e.g., searching for code snippets, math, bugs, or complex architecture). Simple chats route to Gemini 2.5 Flash for rapid answers (40ms), while advanced reasoning queries route to OpenRouter deep-thinking models.",
      specs: [
        { label: "Fast Engine", val: "Gemini 2.5 Flash API" },
        { label: "Reasoning Engine", val: "OpenRouter Deep Swarm" },
        { label: "Switch Latency", val: "5ms Analysis Overhead" },
      ],
      diagram: "Prompt -> Complexity Parser -> Fast Engine (Gemini) OR Reasoning Engine",
    },
    ora: {
      title: "ORA // Optimal Routing Architecture",
      subtitle: "Fault-Tolerant Key Rotation & API Shield",
      desc: "ORA prevents service interruptions by wrapping all outgoing model queries in a self-healing key rotation system. If OpenRouter returns a 429 (Rate Limited) or 402 (Empty Credit), ORA intercepts the exception, marks the key status, pulls a backup key from Supabase, and re-executes the query in milliseconds.",
      specs: [
        { label: "Key Storage", val: "Secure encrypted DB table" },
        { label: "Rotation Triggers", val: "HTTP 429, 402, 503 errors" },
        { label: "Failover Speed", val: "Under 12ms swap index" },
      ],
      diagram: "HMP Request -> ORA Gateway -> Key #1 (429 Error) -> Swap Key #2 -> Success",
    },
    vasp: {
      title: "VASP // Vectorized Agent Synaptic Protocol",
      subtitle: "OUR NEW PROTOCOL: Edge Context Delta Sync & Predictive Routing",
      desc: "VASP is a new protocol developed specifically for Nexa. It synchronizes localized conversation states between the NodeJS WhatsApp Web client and remote vector engines using binary delta compression. Rather than sending the entire chat history, VASP transmits sliding-window context diffs and predicts the next 3 conversation branches, optimizing response latency by 45%.",
      specs: [
        { label: "Synchronization Mode", val: "Binary Delta Compression" },
        { label: "Memory Retention", val: "Edge-cached sliding context window" },
        { label: "Performance Gain", val: "45% reduction in context tokens" },
      ],
      diagram: "Client State -> VASP Diffs -> Edge Cache -> Context Prediction -> ORA Pipeline",
    },
  };

  return (
    <section id="architecture" className="py-24 relative overflow-hidden bg-black">
      {/* Visual background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-950/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-xs font-bold tracking-widest text-red-500 uppercase mb-3">
            Core Architecture
          </h2>
          <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Nexa Core System Stack
          </h3>
          <p className="text-zinc-400 text-base sm:text-lg">
            Nexa runs on a highly specialized pipeline. Here is the breakdown of its custom components and the newly introduced <strong>VASP</strong> protocol.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {(Object.keys(techDetails) as Array<keyof typeof techDetails>).map((key) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3.5 rounded-xl border text-sm font-bold tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-white"
                }`}
              >
                {key.toUpperCase()} Core
              </button>
            );
          })}
        </div>

        {/* Active Content Panel */}
        <div className="glass-panel p-8 rounded-3xl glow-card-red bg-zinc-950/60 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-12 gap-8 items-center"
            >
              {/* Technical description */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <h4 className="font-heading text-2xl font-black text-white">
                    {techDetails[activeTab].title}
                  </h4>
                  <p className="text-sm text-red-400 mt-1 font-semibold uppercase tracking-wider">
                    {techDetails[activeTab].subtitle}
                  </p>
                </div>
                
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {techDetails[activeTab].desc}
                </p>

                {/* SPEC TABLE */}
                <div className="border-t border-zinc-900 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {techDetails[activeTab].specs.map((spec, sidx) => (
                    <div key={sidx} className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{spec.label}</div>
                      <div className="text-xs text-white font-semibold mt-1">{spec.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphical Schema Panel - Clickable to Open Explanation Lightbox */}
              <button
                onClick={() => openModal(activeTab as ModalType)}
                className="md:col-span-5 bg-[#070507] hover:bg-[#0c090c] border border-zinc-900/60 hover:border-red-500/20 rounded-2xl p-6 relative flex flex-col justify-between min-h-[220px] text-left cursor-pointer group transition-all duration-300 w-full"
              >
                <div className="absolute top-2 right-4 text-[9px] text-zinc-600 font-mono">pipeline_schema.v1</div>
                
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-red-500">
                  <Layers className="w-4 h-4 animate-pulse" />
                  <span>Data Flow Diagram</span>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center py-4 w-full">
                  <div className="text-xs text-zinc-300 font-mono text-center bg-zinc-950/80 px-4 py-3 rounded-lg border border-red-500/10 shadow-inner leading-relaxed group-hover:border-red-500/30 transition-colors w-full">
                    {techDetails[activeTab].diagram}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-[10px] text-zinc-500 font-mono w-full">
                  <span className="flex items-center gap-1 text-red-400 font-bold group-hover:underline">
                    <Eye className="w-3.5 h-3.5" /> Explain Spec
                  </span>
                  <span>Sync: Real-Time</span>
                </div>
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
