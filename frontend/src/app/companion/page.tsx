"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { companionApi, analyticsApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { ChatMessage, AnalyticsSummary } from "@/types";

// Crisis keywords — if detected, show resources immediately
const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "don't want to live",
  "self harm", "self-harm", "hurt myself", "cutting", "overdose",
  "not worth living", "better off dead", "want to die",
];

function containsCrisisContent(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function CompanionPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load mood context on mount so companion is aware of recent patterns
  useEffect(() => {
    analyticsApi.getSummary().then(setSummary).catch(() => null);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Check for crisis content before sending
    if (containsCrisisContent(text)) {
      setShowCrisis(true);
    }

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const moodContext = summary
        ? {
            avg_mood_7d: summary.avg_mood_7d,
            trend: summary.trend_direction,
            streak: summary.streak_days,
          }
        : undefined;

      const res = await companionApi.chat(text, messages, moodContext);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: res.response,
      };

      setMessages([...updatedHistory, assistantMessage]);
    } catch (err) {
      setError(getApiErrorMessage(err));
      // Remove the user message if the request failed
      setMessages(messages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowCrisis(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="font-bold text-slate-800">MindGuard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-secondary text-sm py-2">
            ← Dashboard
          </Link>
          <Link href="/checkin" className="btn-primary text-sm py-2">
            + Check In
          </Link>
          <button onClick={handleLogout} className="btn-secondary text-sm py-2">
            Logout
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              AI Companion 🤖
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              A safe space to talk about how you&apos;re feeling
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>

        {/* Mood context banner */}
        {summary && summary.avg_mood_7d && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5 text-sm text-brand-700 flex items-center gap-2">
            <span>📊</span>
            <span>
              Your 7-day average mood is{" "}
              <strong>{summary.avg_mood_7d.toFixed(1)}/5</strong> — trend is{" "}
              <strong>{summary.trend_direction}</strong>. The companion is
              aware of this context.
            </span>
          </div>
        )}

        {/* Crisis resources banner */}
        {showCrisis && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-800 mb-2">
              🆘 It sounds like you might be going through something serious.
            </p>
            <p className="text-red-700 text-sm mb-3">
              Please reach out to a real person who can help right now:
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-red-700">
                <span>📱</span>
                <span>
                  <strong>988 Suicide & Crisis Lifeline</strong> — call or text{" "}
                  <strong>988</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <span>💬</span>
                <span>
                  <strong>Crisis Text Line</strong> — text{" "}
                  <strong>HOME to 741741</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <span>🌐</span>
                <span>
                  <strong>International:</strong>{" "}
                  <a
                    href="https://findahelpline.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    findahelpline.com
                  </a>
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowCrisis(false)}
              className="text-xs text-red-500 mt-3 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Chat window */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <WelcomeScreen username={user?.display_name ?? user?.username} />
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-slate-100 p-4 flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share how you're feeling… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 input resize-none min-h-[44px] max-h-32 py-2.5"
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn-primary py-2.5 px-4 shrink-0"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin block" />
              ) : (
                "Send →"
              )}
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center pb-2">
          MindGuard AI is not a therapist and cannot provide clinical advice.
          For urgent help contact 988 or text HOME to 741741.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WelcomeScreen({ username }: { username?: string }) {
  const starters = [
    "I've been feeling really anxious lately",
    "Had a good day today and wanted to share",
    "I'm struggling to sleep and it's affecting my mood",
    "Feeling a bit overwhelmed with everything",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
      <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🤖</span>
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">
        Hi {username ? username : "there"} 👋
      </h2>
      <p className="text-slate-500 text-sm max-w-sm mb-6">
        I&apos;m here to listen and support you. This is a safe, private space
        — share whatever is on your mind.
      </p>

      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs text-slate-400 mb-2">Try saying:</p>
        {starters.map((s) => (
          <button
            key={s}
            onClick={() => {
              const textarea = document.querySelector("textarea");
              if (textarea) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  "value"
                )?.set;
                nativeInputValueSetter?.call(textarea, s);
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                textarea.focus();
              }
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-sm transition-colors border border-slate-100"
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-brand-500" : "bg-brand-100"
        }`}
      >
        <span className="text-sm">{isUser ? "👤" : "🤖"}</span>
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-brand-500 text-white rounded-tr-sm"
            : "bg-slate-100 text-slate-800 rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
