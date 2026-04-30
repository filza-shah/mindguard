"use client";
// frontend/src/app/companion/page.tsx

import { useState, useRef, useEffect } from "react";
import { companionApi, analyticsApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { ChatMessage, AnalyticsSummary } from "@/types";
import AppShell from "@/components/AppShell";

const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "don't want to live",
  "self harm", "self-harm", "hurt myself", "cutting", "overdose", "want to die",
];

function hasCrisis(text: string) {
  return CRISIS_KEYWORDS.some(k => text.toLowerCase().includes(k));
}

const STARTERS = [
  "I've been feeling really anxious lately",
  "Had a good day today and wanted to share",
  "Struggling to sleep and it's affecting my mood",
  "Feeling a bit overwhelmed with everything",
];

export default function CompanionPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { analyticsApi.getSummary().then(setSummary).catch(() => null); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (hasCrisis(text)) setShowCrisis(true);

    const userMsg: ChatMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const ctx = summary ? { avg_mood_7d: summary.avg_mood_7d, trend: summary.trend_direction } : undefined;
      const res = await companionApi.chat(text, messages, ctx);
      setMessages([...history, { role: "assistant", content: res.response }]);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setMessages(messages);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const setStarter = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen md:h-auto md:min-h-screen max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="display-font text-3xl" style={{ color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
              AI Companion
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              A safe, private space to talk
            </p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setShowCrisis(false); }}
              className="text-xs py-1.5 px-3 rounded-lg transition-colors"
              style={{ color: "var(--muted)", background: "var(--stone)" }}>
              Clear
            </button>
          )}
        </div>

        {/* Mood context */}
        {summary?.avg_mood_7d && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: "var(--sage-light)", color: "var(--sage-dark)" }}>
            <span>📊</span>
            <span>
              Your 7-day mood avg is <strong>{summary.avg_mood_7d.toFixed(1)}/5</strong> — {summary.trend_direction}
            </span>
          </div>
        )}

        {/* Crisis banner */}
        {showCrisis && (
          <div className="mb-4 rounded-xl p-4" style={{ background: "#FFE8E8", border: "1px solid #F0A0A0" }}>
            <p className="font-semibold text-sm mb-2" style={{ color: "#C0392B" }}>
              🆘 It sounds like you may be going through something serious
            </p>
            <p className="text-xs mb-3" style={{ color: "#C0392B" }}>Please reach out to someone who can help right now:</p>
            <div className="space-y-1.5 text-xs" style={{ color: "#C0392B" }}>
              <p>📱 <strong>988 Suicide & Crisis Lifeline</strong> — call or text 988</p>
              <p>💬 <strong>Crisis Text Line</strong> — text HOME to 741741</p>
              <p>🌐 <strong>International:</strong> findahelpline.com</p>
            </div>
            <button onClick={() => setShowCrisis(false)}
              className="text-xs mt-3" style={{ color: "#C0392B", opacity: 0.7 }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Chat window */}
        <div className="flex-1 card flex flex-col min-h-[400px] p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: "var(--sage-light)" }}>🤖</div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--charcoal)" }}>
                  Hi {user?.display_name ?? "there"} 👋
                </h3>
                <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--muted)", lineHeight: "1.6" }}>
                  I&apos;m here to listen. Share whatever is on your mind — this is a safe, private space.
                </p>
                <div className="w-full max-w-xs space-y-2">
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => setStarter(s)}
                      className="w-full text-left text-sm px-4 py-2.5 rounded-xl transition-colors"
                      style={{ background: "var(--stone)", color: "var(--charcoal)", border: "1px solid var(--border)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--sage-light)"; (e.currentTarget as HTMLElement).style.color = "var(--sage-dark)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--stone)"; (e.currentTarget as HTMLElement).style.color = "var(--charcoal)"; }}>
                      &ldquo;{s}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ background: msg.role === "user" ? "var(--charcoal)" : "var(--sage-light)", color: msg.role === "user" ? "white" : "var(--sage-dark)" }}>
                  {msg.role === "user" ? "U" : "AI"}
                </div>
                <div className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={msg.role === "user"
                    ? { background: "var(--charcoal)", color: "white", borderBottomRightRadius: "4px" }
                    : { background: "var(--stone)", color: "var(--charcoal)", border: "1px solid var(--border)", borderBottomLeftRadius: "4px" }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ background: "var(--sage-light)", color: "var(--sage-dark)" }}>AI</div>
                <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--stone)", border: "1px solid var(--border)" }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: "var(--muted)", animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 px-3 py-2 rounded-lg text-xs" style={{ background: "#FFE8E8", color: "#C0392B" }}>
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4 flex gap-3 items-end" style={{ borderColor: "var(--border)" }}>
            <textarea ref={textareaRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Share how you're feeling… (Enter to send)"
              rows={1} disabled={loading}
              className="flex-1 input resize-none text-sm py-2.5"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${t.scrollHeight}px`;
              }} />
            <button onClick={send} disabled={loading || !input.trim()}
              className="btn-primary shrink-0 py-2.5 px-4">
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                : "→"}
            </button>
          </div>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: "var(--muted)" }}>
          Not a therapist. For urgent help contact 988 or text HOME to 741741.
        </p>
      </div>
    </AppShell>
  );
}
