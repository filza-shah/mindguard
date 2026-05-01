"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { analyticsApi, checkinsApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { AnalyticsSummary, MoodTrend, CheckIn } from "@/types";
import { MoodTrendChart } from "@/components/charts/MoodTrendChart";
import AppShell from "@/components/AppShell";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends,  setTrends]  = useState<MoodTrend[]>([]);
  const [checkins,setCheckins]= useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([analyticsApi.getSummary(), analyticsApi.getTrends(30), checkinsApi.list(0, 7)])
      .then(([s, t, c]) => { setSummary(s); setTrends(t); setCheckins(c); })
      .catch(e => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mx-auto mb-4"
            style={{ border: "3px solid var(--teal)", borderTopColor: "transparent" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Loading your dashboard…</p>
        </div>
      </div>
    </AppShell>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const trendUp   = summary?.trend_direction === "improving";
  const trendDown = summary?.trend_direction === "declining";

  const moodColor = (score: number) => score >= 4 ? "var(--teal)" : score === 3 ? "var(--amber)" : "var(--red)";
  const moodBg    = (score: number) => score >= 4 ? "var(--teal-50)" : score === 3 ? "var(--amber-bg)" : "var(--red-bg)";

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-8 anim-up">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{greeting} 👋</p>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.03em" }}>
              {user?.display_name ?? user?.username}&apos;s Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Track your emotional patterns and mental wellbeing over time
            </p>
          </div>
          <Link href="/checkin" className="btn-primary">
            + Check In Today
          </Link>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
            {error}
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "7-Day Avg Mood",
              value: summary?.avg_mood_7d ? summary.avg_mood_7d.toFixed(1) : "—",
              unit: "out of 5",
              icon: "😊",
              color: "var(--teal)",
              desc: "Your average mood score this week",
              delay: "d1",
            },
            {
              label: "Check-in Streak",
              value: `${summary?.streak_days ?? 0}`,
              unit: "days in a row",
              icon: "🔥",
              color: "var(--orange)",
              desc: "Consecutive days you've checked in",
              delay: "d2",
            },
            {
              label: "30-Day Trend",
              value: trendUp ? "Improving" : trendDown ? "Declining" : "Stable",
              unit: "",
              icon: trendUp ? "📈" : trendDown ? "📉" : "➡️",
              color: trendUp ? "var(--green)" : trendDown ? "var(--red)" : "var(--slate)",
              desc: "How your mood is changing over time",
              delay: "d3",
            },
            {
              label: "Total Check-ins",
              value: `${summary?.total_checkins ?? 0}`,
              unit: "all time",
              icon: "📋",
              color: "var(--navy)",
              desc: "Total number of mood check-ins logged",
              delay: "d4",
            },
          ].map(stat => (
            <div key={stat.label} className={`stat-card anim-up ${stat.delay}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  {stat.label}
                </p>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p style={{ fontSize: "1.875rem", fontWeight: 800, color: stat.color, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {stat.value}
              </p>
              {stat.unit && (
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{stat.unit}</p>
              )}
              <p className="text-xs mt-3 pt-3" style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link href="/checkin" className="card-interactive anim-up d2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0"
                style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-deeper))" }}>
                ✦
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--navy)" }}>Daily Check-in</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Log your mood, energy &amp; sleep</p>
              </div>
            </div>
          </Link>

          <Link href="/companion" className="card-interactive anim-up d3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0"
                style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}>
                ◎
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--navy)" }}>AI Companion</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Talk to your supportive AI</p>
              </div>
            </div>
          </Link>

          <Link href="/alerts" className="card-interactive anim-up d4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0 relative"
                style={{ background: summary?.unacknowledged_alerts ? "linear-gradient(135deg, var(--red), #B91C1C)" : "linear-gradient(135deg, var(--slate), var(--navy))" }}>
                ◉
                {!!summary?.unacknowledged_alerts && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "white", color: "var(--red)" }}>
                    {summary.unacknowledged_alerts}
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--navy)" }}>Anomaly Alerts</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {summary?.unacknowledged_alerts
                    ? `${summary.unacknowledged_alerts} alert${summary.unacknowledged_alerts > 1 ? "s" : ""} need attention`
                    : "All patterns look normal"}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Chart ── */}
        <div className="card mb-6 anim-up d3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">Mood Trend — Last 30 Days</h2>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Daily average of mood score (1–5), energy level, and calmness rating
              </p>
            </div>
            <span className="tag tag-teal">30 days</span>
          </div>

          {trends.length > 0 ? (
            <MoodTrendChart data={trends} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-4 rounded-xl"
              style={{ background: "var(--bg)" }}>
              <span className="text-4xl">📊</span>
              <div className="text-center">
                <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>No data yet</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  Complete your first check-in to start seeing trends
                </p>
              </div>
              <Link href="/checkin" className="btn-primary py-2 px-4 text-xs">
                Start now →
              </Link>
            </div>
          )}
        </div>

        {/* ── Recent check-ins ── */}
        <div className="card anim-up d4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">Recent Check-ins</h2>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Your last 7 mood check-ins</p>
            </div>
            <Link href="/checkin" className="btn-primary py-2 px-4 text-xs">
              + New check-in
            </Link>
          </div>

          {checkins.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ background: "var(--bg)" }}>
              <p className="text-3xl mb-3">✍️</p>
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>No check-ins yet</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Your first check-in takes less than 2 minutes
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {checkins.map((c, i) => {
                const date = new Date(c.created_at).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={c.id}
                    className="flex items-center justify-between py-3.5"
                    style={{ borderBottom: i < checkins.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex items-center gap-4">
                      {/* Mood badge */}
                      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: moodBg(c.mood_score) }}>
                        <span className="text-sm font-bold" style={{ color: moodColor(c.mood_score) }}>
                          {c.mood_score}
                        </span>
                        <span className="text-xs" style={{ color: moodColor(c.mood_score), opacity: 0.7 }}>/5</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                            Mood {c.mood_score}/5
                          </p>
                          <span style={{ color: "var(--border)", fontSize: "1rem" }}>·</span>
                          <p className="text-sm" style={{ color: "var(--slate)" }}>
                            Energy {c.energy_level}/5
                          </p>
                          <span style={{ color: "var(--border)", fontSize: "1rem" }}>·</span>
                          <p className="text-sm" style={{ color: "var(--slate)" }}>
                            Sleep {c.sleep_hours ?? "—"}h
                          </p>
                          {c.sentiment_label && (
                            <span className={`tag text-xs ${
                              c.sentiment_label === "positive" ? "tag-green"
                              : c.sentiment_label === "negative" ? "tag-red"
                              : "tag-teal"}`}>
                              {c.sentiment_label}
                            </span>
                          )}
                        </div>
                        {c.note && (
                          <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--muted)" }}>
                            &ldquo;{c.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs shrink-0 ml-4" style={{ color: "var(--muted)" }}>{date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
