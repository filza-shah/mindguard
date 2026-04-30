"use client";
// frontend/src/app/dashboard/page.tsx

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
  const [trends, setTrends] = useState<MoodTrend[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      analyticsApi.getSummary(),
      analyticsApi.getTrends(30),
      checkinsApi.list(0, 7),
    ]).then(([s, t, c]) => {
      setSummary(s); setTrends(t); setCheckins(c);
    }).catch(err => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: "var(--sage)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        </div>
      </div>
    </AppShell>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const trendUp = summary?.trend_direction === "improving";
  const trendDown = summary?.trend_direction === "declining";

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="animate-fade-up">
          <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>{greeting}</p>
          <h1 className="display-font text-4xl" style={{ color: "var(--charcoal)", letterSpacing: "-0.03em" }}>
            {user?.display_name ?? user?.username} 👋
          </h1>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#FFE8E8", color: "#C0392B" }}>
            {error}
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "7-Day Mood",
              value: summary?.avg_mood_7d ? `${summary.avg_mood_7d.toFixed(1)}` : "—",
              unit: "/ 5",
              icon: "😊",
              delay: "stagger-1",
            },
            {
              label: "Check-in Streak",
              value: `${summary?.streak_days ?? 0}`,
              unit: "days",
              icon: "🔥",
              delay: "stagger-2",
            },
            {
              label: "Trend",
              value: trendUp ? "Improving" : trendDown ? "Declining" : "Stable",
              unit: "",
              icon: trendUp ? "📈" : trendDown ? "📉" : "➡️",
              delay: "stagger-3",
            },
            {
              label: "Total Check-ins",
              value: `${summary?.total_checkins ?? 0}`,
              unit: "",
              icon: "📋",
              delay: "stagger-4",
            },
          ].map((stat) => (
            <div key={stat.label} className={`card animate-fade-up ${stat.delay}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="label">{stat.label}</p>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold" style={{ color: "var(--charcoal)", letterSpacing: "-0.03em" }}>
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-sm" style={{ color: "var(--muted)" }}>{stat.unit}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up stagger-2">
          <Link href="/checkin" className="card-hover flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0"
              style={{ background: "var(--charcoal)" }}>✦</div>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--charcoal)" }}>Daily Check-in</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Log mood, energy & sleep</p>
            </div>
          </Link>
          <Link href="/companion" className="card-hover flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0"
              style={{ background: "var(--sage)" }}>◎</div>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--charcoal)" }}>AI Companion</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Talk about how you feel</p>
            </div>
          </Link>
          <Link href="/alerts" className="card-hover flex items-center gap-4 p-4">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0"
              style={{ background: summary?.unacknowledged_alerts ? "#E05C5C" : "var(--sage-dark)" }}>
              ◉
              {summary?.unacknowledged_alerts ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ color: "#E05C5C" }}>
                  {summary.unacknowledged_alerts}
                </span>
              ) : null}
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--charcoal)" }}>Alerts</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {summary?.unacknowledged_alerts
                  ? `${summary.unacknowledged_alerts} unacknowledged`
                  : "All clear"}
              </p>
            </div>
          </Link>
        </div>

        {/* Chart */}
        <div className="card animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">Mood Trends</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Last 30 days</p>
            </div>
          </div>
          {trends.length > 0 ? (
            <MoodTrendChart data={trends} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3"
              style={{ color: "var(--muted)" }}>
              <span className="text-3xl opacity-40">📊</span>
              <p className="text-sm">Complete your first check-in to see trends</p>
              <Link href="/checkin" className="btn-sage py-2 px-4 text-sm">Start now →</Link>
            </div>
          )}
        </div>

        {/* Recent check-ins */}
        <div className="card animate-fade-up stagger-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Check-ins</h2>
            <Link href="/checkin" className="text-sm font-medium" style={{ color: "var(--sage-dark)" }}>
              + New
            </Link>
          </div>
          {checkins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No check-ins yet.{" "}
                <Link href="/checkin" style={{ color: "var(--sage-dark)" }} className="underline">
                  Start now!
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {checkins.map((c) => <CheckInRow key={c.id} checkin={c} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function CheckInRow({ checkin }: { checkin: CheckIn }) {
  const moodBg = ["", "#FFE8E8", "#FFF0E0", "#FFF8E0", "#E8F5EE", "#E0F2EC"];
  const moodColor = ["", "#C0392B", "#D68910", "#B7950B", "#1E8449", "#148F77"];
  const date = new Date(checkin.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: moodBg[checkin.mood_score], color: moodColor[checkin.mood_score] }}>
          {checkin.mood_score}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium" style={{ color: "var(--charcoal)" }}>
              Mood {checkin.mood_score}/5 · Energy {checkin.energy_level}/5
            </p>
            {checkin.sentiment_label && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                checkin.sentiment_label === "positive"
                  ? "bg-green-50 text-green-700"
                  : checkin.sentiment_label === "negative"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {checkin.sentiment_label}
              </span>
            )}
          </div>
          {checkin.note && (
            <p className="text-xs truncate max-w-xs" style={{ color: "var(--muted)" }}>
              {checkin.note}
            </p>
          )}
        </div>
      </div>
      <span className="text-xs shrink-0 ml-4" style={{ color: "var(--muted)" }}>{date}</span>
    </div>
  );
}
