import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MindGuard — Youth Mental Wellness", template: "%s | MindGuard" },
  description: "Track your mood, detect patterns, and get AI-powered support for your mental wellbeing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
