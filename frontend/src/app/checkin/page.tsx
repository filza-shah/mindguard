// frontend/src/app/checkin/page.tsx
//
// The daily check-in form — the core interaction of the app.
// Uses a multi-step approach: users go through metrics one at a time,
// then add an optional note, then confirm.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkinsApi, getApiErrorMessage } from "@/lib/api";
import type { MoodLevel } from "@/types";
import { MOOD_LABELS, MOOD_COLORS, ACTIVITY_OPTIONS } from "@/types";

type Step = "mood" | "energy" | "sleep" | "activities" | "note" | "confirm";

const STEPS: Step[] = ["mood", "energy", "sleep", "activities", "note", "confirm"];

export default function CheckInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mood");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [moodScore, setMoodScore] = useState<MoodLevel>(3);
  const [energyLevel, setEnergyLevel] = useState<MoodLevel>(3);
  const [anxietyLevel, setAnxietyLevel] = useState<MoodLevel>(3);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [activities, setActivities] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const toggleActivity = (activity: string) => {
    setActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await checkinsApi.create({
        mood_score: moodScore,
        energy_level: energyLevel,
        anxiety_level: anxietyLevel,
        sleep_hours: sleepHours,
        note: note || undefined,
        activities,
      });
      router.push("/dashboard?checkin=success");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md card">
          {/* Step counter */}
          <p className="text-xs text-slate-400 mb-6">
            Step {stepIndex + 1} of {STEPS.length}
          </p>

          {/* ── Step: Mood ── */}
          {step === "mood" && (
            <ScoreStep
              title="How are you feeling overall? 🌡️"
              subtitle="Be honest — no judgement here."
              value={moodScore}
              onChange={(v) => setMoodScore(v as MoodLevel)}
              labels={MOOD_LABELS}
              colors={MOOD_COLORS}
            />
          )}

          {/* ── Step: Energy ── */}
          {step === "energy" && (
            <ScoreStep
              title="What's your energy level? ⚡"
              subtitle="1 = exhausted, 5 = full of energy"
              value={energyLevel}
              onChange={(v) => setEnergyLevel(v as MoodLevel)}
              labels={{ 1: "Exhausted", 2: "Tired", 3: "Okay", 4: "Energised", 5: "Full of energy" }}
              colors={MOOD_COLORS}
            />
          )}

          {/* ── Step: Sleep ── */}
          {step === "sleep" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">How did you sleep? 😴</h2>
              <p className="text-slate-500 text-sm mb-6">Drag to set hours of sleep last night</p>

              <div className="text-center mb-6">
                <span className="text-5xl font-bold text-brand-500">{sleepHours}</span>
                <span className="text-xl text-slate-500 ml-1">hrs</span>
              </div>

              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </div>
          )}

          {/* ── Step: Activities ── */}
          {step === "activities" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">What did you do today? 🎯</h2>
              <p className="text-slate-500 text-sm mb-4">Select all that apply (optional)</p>

              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map((activity) => (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => toggleActivity(activity)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activities.includes(activity)
                        ? "bg-brand-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step: Note ── */}
          {step === "note" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Anything on your mind? ✍️</h2>
              <p className="text-slate-500 text-sm mb-4">
                Optional — your note is encrypted and private.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Today I felt... because..."
                rows={5}
                maxLength={2000}
                className="input resize-none"
              />
              <p className="text-xs text-slate-400 text-right mt-1">{note.length}/2000</p>
            </div>
          )}

          {/* ── Step: Confirm ── */}
          {step === "confirm" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Review & Submit ✅</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-3 text-sm mb-6">
                <SummaryRow label="Mood" value={`${moodScore}/5 — ${MOOD_LABELS[moodScore]}`} />
                <SummaryRow label="Energy" value={`${energyLevel}/5`} />
                <SummaryRow label="Sleep" value={`${sleepHours} hours`} />
                <SummaryRow label="Activities" value={activities.join(", ") || "None selected"} />
                {note && <SummaryRow label="Note" value={note.slice(0, 60) + (note.length > 60 ? "…" : "")} />}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? "Saving…" : "Save Check-in 🚀"}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {stepIndex > 0 ? (
              <button onClick={goBack} className="btn-secondary text-sm py-2">
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step !== "confirm" && (
              <button onClick={goNext} className="btn-primary text-sm py-2">
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreStep({
  title,
  subtitle,
  value,
  onChange,
  labels,
  colors,
}: {
  title: string;
  subtitle: string;
  value: number;
  onChange: (v: number) => void;
  labels: Record<number, string>;
  colors: Record<number, string>;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 text-sm mb-6">{subtitle}</p>

      <div className="flex justify-center gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
              value === score ? "scale-110 shadow-md text-white" : "bg-slate-100 text-slate-500"
            }`}
            style={value === score ? { backgroundColor: colors[score as MoodLevel] } : undefined}
          >
            {score}
          </button>
        ))}
      </div>

      <p className="text-center text-slate-600 font-medium">{labels[value as MoodLevel]}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
