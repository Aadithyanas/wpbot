"use client";

import React, { useState, useEffect } from "react";
import { Send, QrCode, MessageSquare, Terminal, ExternalLink, Timer, AlertCircle } from "lucide-react";

interface ChatLog {
  sender: "user" | "nexa";
  text: string;
}

const BOT_NUMBER = "918590690060";
const RELEASE_DATE_ISO = "2026-07-06T19:00:00+05:30"; // Monday, July 6, 2026 at 7:00 PM IST

export default function TryNow() {
  const [messages, setMessages] = useState<ChatLog[]>([
    { sender: "nexa", text: "heyyy! Nexa here. I'm your personal WhatsApp assistant. How can I help you today? Ask me to search, book a slot, or generate images." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isReleased: false,
  });

  useEffect(() => {
    const target = new Date(RELEASE_DATE_ISO).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isReleased: true });
        return true;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isReleased: false });
      return false;
    };

    // Run immediately
    const finished = updateCountdown();
    if (finished) return;

    const interval = setInterval(() => {
      const isDone = updateCountdown();
      if (isDone) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const SUGGESTIONS = [
    { label: "Who are you?", text: "who are you" },
    { label: "Check climate in Kochi", text: "what is the weather in Kochi?" },
    { label: "Book calendar slot", text: "book a slot with Amal tomorrow at 3pm" },
    { label: "Generate Flux art", text: "generate cyberpunk street neon art" },
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // User message
    const userMsg: ChatLog = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate reply latency
    setTimeout(() => {
      let replyText = "";
      const normalized = text.toLowerCase();

      if (normalized.includes("who are you") || normalized.includes("aara")) {
        replyText = "I'm Nexa, your personal AI assistant. still learning so bear with me! njan msg convey cheyyam 😉";
      } else if (normalized.includes("weather") || normalized.includes("climate") || normalized.includes("kochi")) {
        replyText = "🌍 Climate Report for Kochi, KL (India):\n- Current Temp: 28.5°C\n- Condition: Slight rain showers 🌦️\n- Humidity: 82%\n- Today's Max: 31°C / Min: 25°C";
      } else if (normalized.includes("book") || normalized.includes("calendar") || normalized.includes("slot")) {
        replyText = "Checking Google Calendar availability... Slot tomorrow at 3:00 PM IST is free. Booking confirmed! 📅 Appended to sheets.";
      } else if (normalized.includes("generate") || normalized.includes("image") || normalized.includes("art")) {
        replyText = "Flux AI engine selected. Generating image... 🎨 Successfully created! Sent direct media URL: [https://image.pollinations.ai/prompt/cyberpunk_art]";
      } else {
        replyText = "Got it! Logging this request. I'll search the web if you need real-time data.";
      }

      setIsTyping(false);
      setMessages((prev) => [...prev, { sender: "nexa", text: replyText }]);
    }, 1500);
  };

  return (
    <section id="try-now" className="py-24 relative overflow-hidden bg-zinc-950/40">
      {/* Mesh Glow Background */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-red-950/5 blur-[80px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-xs font-bold tracking-widest text-red-500 uppercase mb-3">
            Nexa Live Access
          </h2>
          <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Try Nexa Directly
          </h3>
          <p className="text-zinc-400 text-base sm:text-lg">
            Nexa is running live. Test using our sandbox console below, or view details for the official online WhatsApp release!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Left Panel: Chat Console emulator */}
          <div className="md:col-span-8 flex flex-col glass-panel rounded-2xl bg-zinc-950/70 overflow-hidden border border-zinc-900 shadow-xl min-h-[460px]">
            {/* Header */}
            <div className="bg-zinc-900/90 border-b border-zinc-850 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-heading text-xs font-extrabold text-white tracking-widest uppercase">
                  Sandbox Console
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">v1.2.0-stable</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[300px] flex flex-col gap-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] rounded-xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-red-600 text-white self-end rounded-tr-none"
                      : "bg-zinc-900/90 border border-zinc-850 text-zinc-200 self-start rounded-tl-none"
                  }`}
                >
                  <span className="text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                    {msg.sender === "user" ? "You" : "Nexa"}
                  </span>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              ))}

              {isTyping && (
                <div className="bg-zinc-900/90 border border-zinc-850 text-zinc-400 self-start rounded-xl rounded-tl-none px-4 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-150"></span>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="px-6 py-2 border-t border-zinc-900 flex flex-wrap gap-2">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.text)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-red-950/20 hover:border-red-500/30 border border-zinc-850 rounded-lg text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-4 bg-zinc-900/40 border-t border-zinc-900 flex items-center gap-3"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message (e.g. 'book a calendar slot')"
                className="flex-1 bg-zinc-950 border border-zinc-850 text-sm text-zinc-300 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none placeholder-zinc-600"
              />
              <button
                type="submit"
                className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Panel: Try Nexa Option - Direct WhatsApp Release Countdown & QR */}
          <div className="md:col-span-4 glass-panel rounded-2xl bg-zinc-950/70 border border-zinc-900 p-6 flex flex-col justify-between items-center text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full"></div>

            <div className="space-y-3 w-full">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/30 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                Online Coming Soon
              </div>
              <h4 className="font-heading text-base font-bold text-white uppercase tracking-wider">
                Nexa v0.1 Launch
              </h4>
              <p className="text-xs text-zinc-400">
                Official release next Monday. Scan or click once the countdown ends to connect your WhatsApp!
              </p>
            </div>

            {/* COUNTDOWN CLOCK */}
            <div className="w-full my-6 bg-zinc-950/80 border border-zinc-900/60 p-4 rounded-xl shadow-inner relative">
              <div className="flex items-center justify-center gap-2.5 text-glow-red">
                {/* Days */}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-2xl font-black text-white">{timeLeft.days}</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Days</span>
                </div>
                <span className="text-red-500 font-black text-lg -mt-3">:</span>
                {/* Hours */}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-2xl font-black text-white">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Hours</span>
                </div>
                <span className="text-red-500 font-black text-lg -mt-3">:</span>
                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-2xl font-black text-white">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Mins</span>
                </div>
                <span className="text-red-500 font-black text-lg -mt-3">:</span>
                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-2xl font-black text-red-500">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Secs</span>
                </div>
              </div>
              <div className="text-[9px] text-zinc-500 font-mono mt-3 uppercase tracking-wider">
                Target: Mon, July 6 @ 7:00 PM IST
              </div>
            </div>

            {/* QR Scanner visualizer (Coming Soon) */}
            <div
              className="relative w-36 h-36 border border-zinc-900 bg-zinc-950/30 rounded-xl p-3 my-2 flex items-center justify-center group overflow-hidden"
            >
              {/* Scan red line overlay */}
              <div className="absolute left-0 right-0 h-0.5 bg-red-500/20 shadow-lg shadow-red-500/20 animate-scanline z-10"></div>
              
              <div className="relative opacity-40">
                <QrCode className="w-28 h-28 text-zinc-400" />
              </div>
              
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-1.5 p-2">
                <Timer className="w-5 h-5 text-red-500" />
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Locked Until Launch</span>
              </div>
            </div>

            <div className="w-full mt-4 space-y-4">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 flex items-center justify-between text-xs text-zinc-500">
                <span>Bot Number:</span>
                <span className="font-mono text-zinc-400 font-semibold">+{BOT_NUMBER}</span>
              </div>

              <div
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-zinc-950/80 border border-zinc-900 text-xs font-bold text-zinc-650 rounded-xl cursor-not-allowed opacity-60"
              >
                <MessageSquare className="w-4 h-4 fill-current text-zinc-650" />
                WhatsApp (Coming Soon)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
