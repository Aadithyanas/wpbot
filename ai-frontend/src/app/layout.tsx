import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexa AI | WhatsApp's Personal AI Assistant",
  description: "Meet Nexa — a personal, dual-personality WhatsApp assistant. Active RAG vector memory, autonomous web search, climate reporting, reminders, and smart calendar booking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <body className="bg-black text-zinc-100 min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
