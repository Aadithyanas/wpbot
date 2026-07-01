import React from "react";
import { Header } from "@/components/ui/header-3";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Architecture from "@/components/Architecture";
import TryNow from "@/components/TryNow";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { ModalProvider } from "@/context/ModalContext";
import DetailModal from "@/components/DetailModal";

export default function Home() {
  return (
    <ModalProvider>
      <div className="bg-black text-zinc-100 min-h-screen flex flex-col font-body selection:bg-red-500 selection:text-white relative overflow-x-hidden">
        {/* Global Background Overlays */}
        <div className="absolute inset-0 bg-[#020202] z-0"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full z-0 overflow-hidden pointer-events-none">
          {/* Subtle grid base */}
          <div className="absolute inset-0 bg-[radial-gradient(#1f1010_1px,transparent_1px)] bg-[size:24px_24px] opacity-25"></div>
        </div>

        {/* Foreground Content (Scrollable Container) */}
        <main className="relative z-10 w-full bg-black border-b border-zinc-900 rounded-b-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.9)] pb-16">
          <Header />
          <Hero />
          <About />
          <Features />
          <Services />
          <Architecture />
          <TryNow />
        </main>

        {/* The Cinematic Reveal Footer sits underneath */}
        <CinematicFooter />

        {/* Technical Explainer Lightbox Modal */}
        <DetailModal />
      </div>
    </ModalProvider>
  );
}
