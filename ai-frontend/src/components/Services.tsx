"use client";

import React from "react";
import { ArrowDown, MessageSquare, Database, Cpu, Send, ShieldCheck } from "lucide-react";

export default function Services() {
  const steps = [
    {
      icon: MessageSquare,
      title: "1. Ingress Packet Stream",
      desc: "WhatsApp webhooks intercept incoming chat packets in real-time. System performs active authentication check against stored session tokens.",
    },
    {
      icon: Database,
      title: "2. Vector Context Fusion",
      desc: "Computes user intent vector. Performs vector similarity queries in Supabase database to fetch relevant memory records and PDF context.",
    },
    {
      icon: Cpu,
      title: "3. HMP & ORA Execution",
      desc: "Decision engine parses the request, executes autonomous tool calls, manages key rotations, and executes generation passes via LLM.",
    },
    {
      icon: Send,
      title: "4. Egress Stream",
      desc: "Validates response safety boundaries, parses custom Malayalam/Manglish filters, and transmits final reply back to the WhatsApp client.",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-zinc-950/20 border-y border-zinc-900">
      {/* Background neon strip */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-heading text-xs font-bold tracking-widest text-red-500 uppercase mb-3">
            Core Service Architecture
          </h2>
          <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-6">
            End-to-End Execution Pipeline
          </h3>
          <p className="text-zinc-400 text-base sm:text-lg">
            Nexa processes incoming chat streams through an ultra-low latency, decoupled pipeline. It leverages localized databases and remote APIs in parallel.
          </p>
        </div>

        {/* Step Cards with Visual Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[44px] left-12 right-12 h-[2px] bg-gradient-to-r from-red-950 via-red-500/20 to-red-950 z-0"></div>

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left group z-10">
                {/* Step Circle */}
                <div className="w-14 h-14 rounded-full bg-zinc-950 border-2 border-zinc-900 group-hover:border-red-500 flex items-center justify-center text-red-500 shadow-md group-hover:shadow-red-500/20 transition-all duration-300 mb-6 bg-radial-gradient">
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>

                <h4 className="font-heading text-lg font-bold text-white mb-3 group-hover:text-red-400 transition-colors">
                  {step.title}
                </h4>
                
                <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto md:mx-0">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Technical Callout */}
        <div className="mt-20 glass-panel p-6 rounded-2xl glow-card-red bg-zinc-950/40 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-950/30 text-red-500 border border-red-500/20">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-heading text-base font-bold text-white">Secure Encrypted Credentials</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Google service accounts operate using local, high-security credentials keyfiles. Session caches store encrypted metadata keys directly in standard local directory layouts.
              </p>
            </div>
          </div>
          <div className="text-zinc-500 font-mono text-xs border border-zinc-900 px-4 py-2 rounded-lg bg-zinc-950">
            SSL // SECURE CORE
          </div>
        </div>
      </div>
    </section>
  );
}
