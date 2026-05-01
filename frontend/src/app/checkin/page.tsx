"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkinsApi, getApiErrorMessage } from "@/lib/api";
import type { MoodLevel } from "@/types";
import { MOOD_LABELS, ACTIVITY_OPTIONS } from "@/types";
import AppShell from "@/components/AppShell";

type Step = "mood" | "energy" | "anxiety" | "sleep" | "activities" | "note" | "confirm";
const STEPS: Step[] = ["mood", "energy", "anxiety", "sleep", "activities", "note", "confirm"];

const STEP_INFO = {
  mood:       { num: 1, title: "How are you feeling overall?", sub: "This is your general emotional state right now. Be honest — no one else can see this." },
  energy:     { num: 2, title: "What is your energy level?", sub: "1 = completely drained, 5 = full of energy and motivation." },
  anxiety:    { num: 3, title: "How calm do you feel?", sub: "1 = very anxious or stressed, 5 = completely calm and relaxed." },
  sleep:      { num: 4, title: "How much did you sleep last night?", sub: "Drag the slider to set how many hours of sleep you got." },
  activities: { num: 5, title: "What did you do today?", sub: "Select everything that applies. This helps us understand what impacts your mood." },
  note:       { num: 6, title: "Anything on your mind?", sub: "Optional. Write as much or as little as you want. Your note is encrypted — only you can read it." },
  confirm:    { num: 7, title: "Review your check-in", sub: "Everything looks good? Hit Save to log your check-in for today." },
};

const SCORE_LABELS: Record<number, { label: string; emoji: string; color: string; bg: string }> = {
  1: { label: "Very Low",  emoji: "😔", color: "#DC2626", bg: "#FEF2F2" },
  2: { label: "Low",       emoji: "😕", color: "#EA580C", bg: "#FFF7ED" },
  3: { label: "Okay",      emoji: "😐", color: "#D97706", bg: "#FFFBEB" },
  4: { label: "Good",      emoji: "🙂", color: "#16A34A", bg: "#F0FDF4" },
  5: { label: "Great",     emoji: "😄", color: "#0D9488", bg: "#F0FDFA" },
};

export default function CheckInPage() {
  const router = useRouter();
  const [step,        setStep]        = useState<Step>("mood");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [moodScore,   setMoodScore]   = useState<MoodLevel>(3);
  const [energyLevel, setEnergyLevel] = useState<MoodLevel>(3);
  const [anxietyLevel,setAnxietyLevel]= useState<MoodLevel>(3);
  const [sleepHours,  setSleepHours]  = useState(7);
  const [activities,  setActivities]  = useState<string[]>([]);
  const [note,        setNote]        = useState("");

  const idx      = STEPS.indexOf(step);
  const progress = ((idx + 1) / STEPS.length) * 100;
  const info     = STEP_INFO[step];

  const next = () => { const n = STEPS[idx + 1]; if (n) setStep(n); };
  const back = () => { const p = STEPS[idx - 1]; if (p) setStep(p); };
  const toggle = (a: string) => setActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      await checkinsApi.create({ mood_score: moodScore, energy_level: energyLevel, anxiety_level: anxietyLevel, sleep_hours: sleepHours, note: note || undefined, activities });
      router.push("/dashboard");
    } catch (e) { setError(getApiErrorMessage(e)); setSubmitting(false); }
  };

  const ScoreRow = ({ value, onChange }: { value: number; onChange: (v: MoodLevel) => void }) => (
    <div>
      <div className="flex gap-2 mb-4">
        {([1,2,3,4,5] as MoodLevel[]).map(n => {
          const s = SCORE_LABELS[n];
          const active = value === n;
          return (
            <button key={n} onClick={() => onChange(n)}
              className="flex-1 py-5 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-150 font-semibold"
              style={{
                background: active ? s.bg : "var(--bg)",
                border: `2px solid ${active ? s.color : "var(--border)"}`,
                color: active ? s.color : "var(--muted)",
                transform: active ? "scale(1.04)" : "scale(1)",
                boxShadow: active ? `0 4px 12px ${s.color}30` : "none",
              }}>
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-sm">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="text-center py-2 rounded-xl" style={{ background: SCORE_LABELS[value].bg }}>
        <span className="text-sm font-semibold" style={{ color: SCORE_LABELS[value].color }}>
          {SCORE_LABELS[value].emoji} {SCORE_LABELS[value].label}
        </span>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6 anim-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="tag tag-teal">Step {info.num} of {STEPS.length}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
            <span className="text-xs font-bold" style={{ color: "var(--teal)" }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--teal), var(--teal-dark))" }} />
          </div>
        </div>

        <div className="card anim-up d1">
          <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            {info.title}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)", lineHeight: "1.6" }}>{info.sub}</p>

          {/* ── Mood ── */}
          {step === "mood" && <ScoreRow value={moodScore} onChange={setMoodScore} />}

          {/* ── Energy ── */}
          {step === "energy" && <ScoreRow value={energyLevel} onChange={setEnergyLevel} />}

          {/* ── Anxiety (inverted — higher = calmer) ── */}
          {step === "anxiety" && <ScoreRow value={anxietyLevel} onChange={setAnxietyLevel} />}

          {/* ── Sleep ── */}
          {step === "sleep" && (
            <div className="text-center">
              <div className="py-8 rounded-2xl mb-6" style={{ background: "var(--bg)" }}>
                <span style={{ fontSize: "5rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.04em" }}>
                  {sleepHours}
                </span>
                <span className="text-2xl font-medium ml-2" style={{ color: "var(--muted)" }}>hrs</span>
              </div>
              <input type="range" min={0} max={12} step={0.5} value={sleepHours}
                onChange={e => setSleepHours(Number(e.target.value))}
                className="w-full mb-3" style={{ accentColor: "var(--teal)", cursor: "pointer" }} />
              <div className="flex justify-between text-xs font-medium" style={{ color: "var(--muted)" }}>
                <span>0 hours</span>
                <span>6 hours</span>
                <span>12 hours</span>
              </div>
              {sleepHours < 6 && (
                <p className="text-xs mt-4 px-4 py-2 rounded-xl font-medium"
                  style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
                  ⚠ Less than 6 hours of sleep can affect your mood significantly
                </p>
              )}
            </div>
          )}

          {/* ── Activities ── */}
          {step === "activities" && (
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map(a => (
                <button key={a} onClick={() => toggle(a)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{
                    background: activities.includes(a) ? "var(--teal)" : "var(--bg)",
                    color: activities.includes(a) ? "white" : "var(--slate)",
                    border: `1.5px solid ${activities.includes(a) ? "var(--teal)" : "var(--border)"}`,
                    boxShadow: activities.includes(a) ? "var(--shadow-teal)" : "none",
                  }}>
                  {a}
                </button>
              ))}
              {activities.length === 0 && (
                <p className="text-xs w-full mt-2" style={{ color: "var(--muted)" }}>
                  Nothing selected — that's fine, skip to the next step.
                </p>
              )}
            </div>
          )}

          {/* ── Note ── */}
          {step === "note" && (
            <div>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Write freely… what's on your mind today? How did you feel and why?"
                rows={6} maxLength={2000}
                className="input resize-none leading-relaxed" />
              <div className="flex justify-between mt-2">
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  🔒 Encrypted and private — only you can read this
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{note.length}/2000</p>
              </div>
            </div>
          )}

          {/* ── Confirm ── */}
          {step === "confirm" && (
            <div>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
                  ⚠ {error}
                </div>
              )}

              <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)" }}>
                {[
                  { label: "Overall Mood", value: `${moodScore}/5 — ${MOOD_LABELS[moodScore]}`, icon: "😊" },
                  { label: "Energy Level", value: `${energyLevel}/5`, icon: "⚡" },
                  { label: "Calmness Level", value: `${anxietyLevel}/5`, icon: "🌿" },
                  { label: "Sleep Last Night", value: `${sleepHours} hours`, icon: "😴" },
                  { label: "Activities Today", value: activities.length ? activities.join(", ") : "None selected", icon: "🎯" },
                  note ? { label: "Journal Note", value: `"${note.slice(0, 100)}${note.length > 100 ? "…" : ""}"`, icon: "📝" } : null,
                ].filter(Boolean).map((row, i, arr) => (
                  <div key={row!.label}
                    className="flex items-start gap-3 px-5 py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span className="text-lg shrink-0 mt-0.5">{row!.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--muted)" }}>
                        {row!.label}
                      </p>
                      <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{row!.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={submit} disabled={submitting} className="btn-primary w-full"
                style={{ padding: "13px", fontSize: "0.9375rem" }}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving check-in…
                  </span>
                ) : "✓ Save Check-in"}
              </button>
            </div>
          )}

          {/* Navigation */}
          {step !== "confirm" && (
            <div className="flex justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              {idx > 0 ? (
                <button onClick={back} className="btn-ghost py-2.5 px-5">← Back</button>
              ) : <div />}
              <div className="flex items-center gap-3">
                {idx > 0 && step !== "note" && (
                  <button onClick={next} className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                    Skip
                  </button>
                )}
                <button onClick={next} className="btn-primary py-2.5 px-6">
                  Continue →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
