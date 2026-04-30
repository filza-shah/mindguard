"use client";
// frontend/src/app/checkin/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkinsApi, getApiErrorMessage } from "@/lib/api";
import type { MoodLevel } from "@/types";
import { MOOD_LABELS, ACTIVITY_OPTIONS } from "@/types";
import AppShell from "@/components/AppShell";

type Step = "mood" | "energy" | "sleep" | "activities" | "note" | "confirm";
const STEPS: Step[] = ["mood", "energy", "sleep", "activities", "note", "confirm"];

const STEP_META = {
  mood: { title: "How are you feeling?", subtitle: "Be honest — this is just for you." },
  energy: { title: "What's your energy like?", subtitle: "1 = completely drained, 5 = full of energy" },
  sleep: { title: "How did you sleep?", subtitle: "Hours of sleep last night" },
  activities: { title: "What did you do today?", subtitle: "Select all that apply" },
  note: { title: "Anything on your mind?", subtitle: "Optional — your note is encrypted and private" },
  confirm: { title: "Ready to save?", subtitle: "Review your check-in below" },
};

const MOOD_COLORS = ["", "#E05C5C", "#E07C50", "#E0B050", "#7CB87C", "#4A9A82"];
const MOOD_BG = ["", "#FFE8E8", "#FFF0E0", "#FFF8E0", "#E8F5EE", "#E0F2EC"];

export default function CheckInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mood");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [moodScore, setMoodScore] = useState<MoodLevel>(3);
  const [energyLevel, setEnergyLevel] = useState<MoodLevel>(3);
  const [anxietyLevel, setAnxietyLevel] = useState<MoodLevel>(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [activities, setActivities] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goNext = () => { const n = STEPS[stepIndex + 1]; if (n) setStep(n); };
  const goBack = () => { const p = STEPS[stepIndex - 1]; if (p) setStep(p); };
  const toggleActivity = (a: string) => setActivities(prev =>
    prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await checkinsApi.create({
        mood_score: moodScore, energy_level: energyLevel,
        anxiety_level: anxietyLevel, sleep_hours: sleepHours,
        note: note || undefined, activities,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="label">Step {stepIndex + 1} of {STEPS.length}</p>
            <p className="text-xs font-medium" style={{ color: "var(--sage-dark)" }}>
              {Math.round(progress)}%
            </p>
          </div>
          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--sage)" }} />
          </div>
        </div>

        <div className="card animate-fade-up">
          <h2 className="display-font text-2xl mb-1" style={{ color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
            {STEP_META[step].title}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            {STEP_META[step].subtitle}
          </p>

          {/* ── Mood ── */}
          {step === "mood" && (
            <div>
              <div className="flex justify-between gap-2 mb-4">
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((n) => (
                  <button key={n} onClick={() => setMoodScore(n)}
                    className="flex-1 py-4 rounded-xl text-xl font-semibold transition-all duration-150"
                    style={{
                      background: moodScore === n ? MOOD_BG[n] : "var(--stone)",
                      color: moodScore === n ? MOOD_COLORS[n] : "var(--muted)",
                      border: moodScore === n ? `2px solid ${MOOD_COLORS[n]}` : "2px solid transparent",
                      transform: moodScore === n ? "scale(1.05)" : "scale(1)",
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-medium" style={{ color: MOOD_COLORS[moodScore] }}>
                {MOOD_LABELS[moodScore]}
              </p>
            </div>
          )}

          {/* ── Energy ── */}
          {step === "energy" && (
            <div>
              <div className="flex justify-between gap-2 mb-4">
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((n) => (
                  <button key={n} onClick={() => setEnergyLevel(n)}
                    className="flex-1 py-4 rounded-xl text-xl font-semibold transition-all duration-150"
                    style={{
                      background: energyLevel === n ? MOOD_BG[n] : "var(--stone)",
                      color: energyLevel === n ? MOOD_COLORS[n] : "var(--muted)",
                      border: energyLevel === n ? `2px solid ${MOOD_COLORS[n]}` : "2px solid transparent",
                      transform: energyLevel === n ? "scale(1.05)" : "scale(1)",
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
                {energyLevel === 1 ? "Exhausted" : energyLevel === 2 ? "Tired" : energyLevel === 3 ? "Okay" : energyLevel === 4 ? "Energised" : "Full of energy"}
              </p>
            </div>
          )}

          {/* ── Sleep ── */}
          {step === "sleep" && (
            <div className="text-center">
              <div className="mb-8">
                <span className="display-font text-7xl" style={{ color: "var(--charcoal)" }}>
                  {sleepHours}
                </span>
                <span className="text-2xl ml-2" style={{ color: "var(--muted)" }}>hrs</span>
              </div>
              <input type="range" min={0} max={12} step={0.5} value={sleepHours}
                onChange={e => setSleepHours(Number(e.target.value))}
                className="w-full mb-3" style={{ accentColor: "var(--sage)" }} />
              <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>0 hrs</span><span>6 hrs</span><span>12 hrs</span>
              </div>
            </div>
          )}

          {/* ── Activities ── */}
          {step === "activities" && (
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((a) => (
                <button key={a} onClick={() => toggleActivity(a)}
                  className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: activities.includes(a) ? "var(--sage)" : "var(--stone)",
                    color: activities.includes(a) ? "white" : "var(--charcoal)",
                    border: activities.includes(a) ? "2px solid transparent" : `2px solid var(--border)`,
                  }}>
                  {a}
                </button>
              ))}
            </div>
          )}

          {/* ── Note ── */}
          {step === "note" && (
            <div>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Today I felt… because…"
                rows={6} maxLength={2000}
                className="input resize-none" />
              <p className="text-xs text-right mt-1" style={{ color: "var(--muted)" }}>
                {note.length}/2000
              </p>
            </div>
          )}

          {/* ── Confirm ── */}
          {step === "confirm" && (
            <div>
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: "#FFE8E8", color: "#C0392B" }}>
                  {error}
                </div>
              )}
              <div className="space-y-3 mb-6">
                {[
                  { label: "Mood", value: `${moodScore}/5 — ${MOOD_LABELS[moodScore]}` },
                  { label: "Energy", value: `${energyLevel}/5` },
                  { label: "Sleep", value: `${sleepHours} hours` },
                  { label: "Activities", value: activities.join(", ") || "None" },
                  note ? { label: "Note", value: note.slice(0, 80) + (note.length > 80 ? "…" : "") } : null,
                ].filter(Boolean).map((row) => (
                  <div key={row!.label} className="flex justify-between py-2 border-b"
                    style={{ borderColor: "var(--border)" }}>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>{row!.label}</span>
                    <span className="text-sm font-medium text-right max-w-[60%]"
                      style={{ color: "var(--charcoal)" }}>
                      {row!.value}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3">
                {submitting ? "Saving…" : "Save check-in →"}
              </button>
            </div>
          )}

          {/* Navigation */}
          {step !== "confirm" && (
            <div className="flex justify-between mt-8">
              {stepIndex > 0 ? (
                <button onClick={goBack} className="btn-secondary py-2 px-5">← Back</button>
              ) : <div />}
              <button onClick={goNext} className="btn-primary py-2 px-5">Continue →</button>
            </div>
          )}
          {step !== "confirm" && stepIndex > 0 && (
            <button onClick={goNext} className="w-full text-center text-sm mt-3"
              style={{ color: "var(--muted)" }}>
              Skip this step
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
