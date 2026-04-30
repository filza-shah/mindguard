"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { analyticsApi, checkinsApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { AnalyticsSummary, MoodTrend, CheckIn } from "@/types";
import { MoodTrendChart } from "@/components/charts/MoodTrendChart";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<MoodTrend[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, c] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getTrends(30),
          checkinsApi.list(0, 5),
        ]);
        setSummary(s);
        setTrends(t);
        setRecentCheckIns(c);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => { logout(); router.push("/login"); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const trendEmoji = summary?.trend_direction === "improving" ? "📈"
    : summary?.trend_direction === "declining" ? "📉" : "➡️";

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="font-bold text-slate-800">MindGuard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 hidden sm:block">
            Hi, {user?.display_name ?? user?.username} 👋
          </span>
          <Link href="/companion" className="btn-secondary text-sm py-2">
            🤖 Companion
          </Link>
          <Link href="/alerts" className="relative btn-secondary text-sm py-2">
            🔔 Alerts
            {summary && summary.unacknowledged_alerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {summary.unacknowledged_alerts}
              </span>
            )}
          </Link>
          <Link href="/checkin" className="btn-primary text-sm py-2">
            + Check In
          </Link>
          <button onClick={handleLogout} className="btn-secondary text-sm py-2">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Track your emotional patterns over time</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="7-Day Avg Mood" value={summary?.avg_mood_7d ? `${summary.avg_mood_7d.toFixed(1)} / 5` : "—"} icon="😊" />
          <SummaryCard label="Check-in Streak" value={`${summary?.streak_days ?? 0} days`} icon="🔥" />
          <SummaryCard label="Trend" value={`${trendEmoji} ${summary?.trend_direction ?? "—"}`} icon="" />
          <SummaryCard label="Total Check-ins" value={String(summary?.total_checkins ?? 0)} icon="📋" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            href="/checkin"
            icon="✍️"
            title="Daily Check-in"
            description="Log today's mood, energy and sleep"
            color="bg-brand-500"
          />
          <QuickAction
            href="/companion"
            icon="🤖"
            title="Talk to Companion"
            description="AI-powered supportive conversation"
            color="bg-purple-500"
          />
          <QuickAction
            href="/alerts"
            icon="🔔"
            title="View Alerts"
            description={`${summary?.unacknowledged_alerts ?? 0} unacknowledged`}
            color="bg-orange-500"
          />
        </div>

        {/* Mood Chart */}
        <div className="card">
          <h2 className="section-title mb-4">30-Day Mood Trend</h2>
          {trends.length > 0 ? (
            <MoodTrendChart data={trends} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
              <span className="text-3xl">📊</span>
              No data yet — complete your first check-in to see trends!
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Check-ins</h2>
            <Link href="/checkin" className="text-brand-600 text-sm font-medium hover:text-brand-700">
              + New
            </Link>
          </div>
          {recentCheckIns.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              You haven&apos;t checked in yet.{" "}
              <Link href="/checkin" className="text-brand-600 underline">Start now!</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((c) => <CheckInRow key={c.id} checkin={c} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-800">
        {icon && <span className="mr-1">{icon}</span>}{value}
      </p>
    </div>
  );
}

function QuickAction({ href, icon, title, description, color }: {
  href: string; icon: string; title: string; description: string; color: string;
}) {
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow flex items-center gap-4 p-4">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

function CheckInRow({ checkin }: { checkin: CheckIn }) {
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  const date = new Date(checkin.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: colors[checkin.mood_score] }}>
          {checkin.mood_score}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">
            Mood: {checkin.mood_score}/5 · Energy: {checkin.energy_level}/5
            {checkin.sentiment_label && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                checkin.sentiment_label === "positive" ? "bg-green-100 text-green-700" :
                checkin.sentiment_label === "negative" ? "bg-red-100 text-red-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {checkin.sentiment_label}
              </span>
            )}
          </p>
          {checkin.note && <p className="text-xs text-slate-400 truncate max-w-xs">{checkin.note}</p>}
        </div>
      </div>
      <span className="text-xs text-slate-400">{date}</span>
    </div>
  );
}
