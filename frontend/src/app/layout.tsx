// frontend/src/app/layout.tsx
//
// The root layout wraps every page in the app.
// This is where you put things that should be on EVERY page:
// - HTML <head> tags (title, meta, fonts)
// - Global providers (toast notifications, etc.)
// - Navigation that's always visible

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load Inter font — Next.js handles this efficiently (no FOUT, self-hosted)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MindGuard",
    template: "%s | MindGuard",  // e.g. "Dashboard | MindGuard"
  },
  description: "Your daily mental wellness companion",
  keywords: ["mental health", "mood tracker", "wellbeing", "youth"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900 antialiased`}>
        {/* 
          In Milestone 2 we'll wrap this with:
          - <AuthProvider> — checks JWT on load
          - <ToastProvider> — for success/error notifications
        */}
        {children}
      </body>
    </html>
  );
}
