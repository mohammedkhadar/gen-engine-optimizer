import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RankAI — Generative Engine Optimization for Business",
  description:
    "Track, audit and optimize how your brand appears in ChatGPT, Perplexity, Gemini, Claude and Google AI Overviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
