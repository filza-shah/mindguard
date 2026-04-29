"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { AnomalyAlert } from "@/types";

export default function AlertsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<AnomalyAlert[]>("/alerts/");
        setAlerts(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiClient.patch(`/alerts/${alertId}/acknowledge`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
    } catch (err) {
      console.error("Failed to acknowledge alert", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const severityConfig = {
    low: { color: "bg-blue-50 border-blue-200 text-blue-700", badge: "bg-blue-100 text-blue-700", icon: "ℹ️" },
    medium: { color: "bg-yellow-50 border-yellow-200 text-yellow-700", badge: "bg-yellow-100 text-yellow-700", icon: "⚠️" },
    high: { color: "bg-orange-50 border-orange-200 text-orange-700", badge: "bg-orange-100 text-orange-700", icon: "🔶" },
    critical: { color: "bg-red-50 border-red-200 text-red-700", badge: "bg-red-100 text-red-700", icon: "🚨" },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="font-bold text-slate-800">MindGuard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-secondary text-sm py-2">← Dashboard</Link>
          <Link href="/checkin" className="btn-primary text-sm py-2">+ Check In</Link>
          <button onClick={handleLogout} className="btn-secondary text-sm py-2">Logout</button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Anomaly Alerts</h1>
          <p className="text-slate-500 text-sm mt-1">
            Automatically detected patterns that may need attention
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading alerts…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="card text-center py-12">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-slate-700 font-medium">No alerts</p>
            <p className="text-slate-400 text-sm mt-1">
              Your mood patterns look normal. Keep checking in daily!
            </p>
          </div>
        )}

        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const date = new Date(alert.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            });

            return (
              <div
                key={alert.id}
                className={`border rounded-xl p-4 ${config.color} ${alert.acknowledged ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{config.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs opacity-70">{date}</span>
                        {alert.acknowledged && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {alert.alert_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-sm opacity-80">{alert.description}</p>
                      <p className="text-xs opacity-60 mt-1">
                        Anomaly score: {alert.anomaly_score.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-white bg-opacity-60 hover:bg-opacity-100 transition-all"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>

                {/* Crisis resource for critical alerts */}
                {alert.severity === "critical" && !alert.acknowledged && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs font-medium">
                      🆘 If you&apos;re in crisis, please reach out:
                      <span className="ml-1">Crisis Text Line: text HOME to 741741</span>
                      <span className="mx-2">·</span>
                      <span>988 Lifeline: call or text 988</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
