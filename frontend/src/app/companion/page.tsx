"use client";
import { useState, useRef, useEffect } from "react";
import { companionApi, analyticsApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { ChatMessage, AnalyticsSummary } from "@/types";
import AppShell from "@/components/AppShell";

const CRISIS = ["suicide","suicidal","kill myself","end my life","self harm","self-harm","hurt myself","want to die","cutting","overdose"];
const hasCrisis = (t: string) => CRISIS.some(k => t.toLowerCase().includes(k));

const STARTERS = [
  { text: "I've been feeling really anxious and don't know why", icon: "😰" },
  { text: "Today was a good day and I wanted to share that", icon: "😊" },
  { text: "I'm struggling to sleep and it's affecting everything", icon: "😴" },
  { text: "I feel overwhelmed and don't know where to start", icon: "🌊" },
];

export default function CompanionPage() {
  const { user } = useAuthStore();
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [summary,    setSummary]    = useState<AnalyticsSummary | null>(null);
  const [crisis,     setCrisis]     = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { analyticsApi.getSummary().then(setSummary).catch(() => null); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (hasCrisis(text)) setCrisis(true);
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history); setInput(""); setLoading(true); setError(null);
    try {
      const ctx = summary ? { avg_mood_7d: summary.avg_mood_7d, trend: summary.trend_direction } : undefined;
      const res = await companionApi.chat(text, messages, ctx);
      setMessages([...history, { role: "assistant", content: res.response }]);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setMessages(messages);
    } finally {
      setLoading(false);
      textRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between anim-up">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>
              AI Companion
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Powered by Llama 3.3 · Private &amp; confidential
            </p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setCrisis(false); setError(null); }}
              className="btn-ghost py-2 px-3 text-xs">
              Clear chat
            </button>
          )}
        </div>

        {/* Mood context bar */}
        {summary?.avg_mood_7d && (
          <div className="mb-3 px-4 py-2.5 rounded-xl flex items-center gap-2 anim-up d1"
            style={{ background: "var(--teal-50)", border: "1px solid var(--teal-light)" }}>
            <span>📊</span>
            <p className="text-xs font-medium" style={{ color: "var(--teal-deeper)" }}>
              Your 7-day avg mood is <strong>{summary.avg_mood_7d.toFixed(1)}/5</strong> — trend is <strong>{summary.trend_direction}</strong>.
              The companion is aware of this context.
            </p>
          </div>
        )}

        {/* Crisis banner */}
        {crisis && (
          <div className="mb-3 p-4 rounded-xl anim-up"
            style={{ background: "var(--red-bg)", border: "1px solid #FECACA" }}>
            <p className="font-bold text-sm mb-2" style={{ color: "var(--red)" }}>
              🆘 It sounds like you may be going through something serious
            </p>
            <p className="text-xs mb-3" style={{ color: "#991B1B" }}>
              Please reach out to a real person who can help you right now:
            </p>
            <div className="space-y-1.5 text-xs" style={{ color: "#991B1B" }}>
              <p>📱 <strong>988 Suicide & Crisis Lifeline</strong> — call or text <strong>988</strong></p>
              <p>💬 <strong>Crisis Text Line</strong> — text <strong>HOME to 741741</strong></p>
              <p>🌐 <strong>International resources:</strong> findahelpline.com</p>
            </div>
            <button onClick={() => setCrisis(false)} className="text-xs mt-2 font-medium"
              style={{ color: "#991B1B", opacity: 0.6 }}>Dismiss</button>
          </div>
        )}

        {/* Chat window */}
        <div className="flex-1 flex flex-col card p-0 overflow-hidden anim-up d2" style={{ minHeight: 0 }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                  style={{ background: "linear-gradient(135deg, var(--teal-50), var(--teal-light))", border: "1px solid var(--teal-light)" }}>
                  🤖
                </div>
                <h3 className="font-bold text-base mb-1" style={{ color: "var(--navy)" }}>
                  Hi {user?.display_name ?? "there"}, I&apos;m here to listen
                </h3>
                <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--muted)", lineHeight: "1.6" }}>
                  This is a safe, private space. Share whatever is on your mind —
                  I&apos;ll listen without judgement and offer support.
                </p>
                <div className="w-full max-w-sm space-y-2">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
                    SUGGESTED CONVERSATION STARTERS
                  </p>
                  {STARTERS.map(s => (
                    <button key={s.text} onClick={() => { setInput(s.text); textRef.current?.focus(); }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--slate)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--teal)"; (e.currentTarget as HTMLElement).style.color = "var(--teal-dark)"; (e.currentTarget as HTMLElement).style.background = "var(--teal-50)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--slate)"; (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}>
                      <span>{s.icon}</span>
                      <span className="text-sm">&ldquo;{s.text}&rdquo;</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-3 anim-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: msg.role === "user" ? "var(--navy)" : "linear-gradient(135deg, var(--teal), var(--teal-dark))",
                    color: "white",
                  }}>
                  {msg.role === "user" ? (user?.display_name ?? "U")[0].toUpperCase() : "AI"}
                </div>
                <div className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={msg.role === "user"
                    ? { background: "var(--navy)", color: "white", borderBottomRightRadius: "6px" }
                    : { background: "var(--bg)", color: "var(--navy)", border: "1px solid var(--border)", borderBottomLeftRadius: "6px" }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                  style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-dark))" }}>AI</div>
                <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderBottomLeftRadius: "6px" }}>
                  <div className="flex gap-1.5 items-center h-4">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: "var(--teal)", animationDelay: `${i*150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
              ⚠ {error}
            </div>
          )}

          {/* Input */}
          <div className="p-4 flex gap-3 items-end" style={{ borderTop: "1px solid var(--border)" }}>
            <textarea ref={textRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Share how you're feeling… (Enter to send, Shift+Enter for new line)"
              rows={1} disabled={loading}
              className="flex-1 input resize-none text-sm"
              style={{ minHeight: "44px", maxHeight: "128px", padding: "11px 14px" }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
              }} />
            <button onClick={send} disabled={loading || !input.trim()} className="btn-primary shrink-0"
              style={{ padding: "11px 18px", minWidth: "56px" }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                : "→"}
            </button>
          </div>
        </div>

        <p className="text-xs text-center mt-3" style={{ color: "var(--muted)" }}>
          MindGuard AI is not a therapist. For urgent help: call/text <strong>988</strong> or text <strong>HOME to 741741</strong>
        </p>
      </div>
    </AppShell>
  );
}
