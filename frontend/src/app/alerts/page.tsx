"use client";
// frontend/src/app/alerts/page.tsx

import { useEffect, useState } from "react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import type { AnomalyAlert } from "@/types";
import AppShell from "@/components/AppShell";

const SEVERITY = {
  low: { bg: "#EEF3F1", color: "#4A6B62", border: "#C0D8D4", icon: "ℹ" },
  medium: { bg: "#FFF8E0", color: "#B7950B", border: "#E8D080", icon: "⚠" },
  high: { bg: "#FFF0E0", color: "#D35400", border: "#F0C080", icon: "◈" },
  critical: { bg: "#FFE8E8", color: "#C0392B", border: "#F0A0A0", icon: "!" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<AnomalyAlert[]>("/alerts/")
      .then(r => setAlerts(r.data))
      .catch(err => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const acknowledge = async (id: string) => {
    await apiClient.patch(`/alerts/${id}/acknowledge`);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const unread = alerts.filter(a => !a.acknowledged).length;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="animate-fade-up">
          <h1 className="display-font text-4xl mb-1" style={{ color: "var(--charcoal)", letterSpacing: "-0.03em" }}>
            Alerts
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {unread > 0 ? `${unread} unacknowledged alert${unread > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
              style={{ borderColor: "var(--sage)", borderTopColor: "transparent" }} />
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#FFE8E8", color: "#C0392B" }}>
            {error}
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="card text-center py-14">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold mb-1" style={{ color: "var(--charcoal)" }}>No alerts</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Your mood patterns look normal. Keep checking in daily!
            </p>
          </div>
        )}

        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const s = SEVERITY[alert.severity as keyof typeof SEVERITY];
            const date = new Date(alert.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            });

            return (
              <div key={alert.id}
                className={`rounded-2xl p-5 transition-all animate-fade-up`}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  opacity: alert.acknowledged ? 0.6 : 1,
                  animationDelay: `${i * 0.05}s`,
                }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: s.color, color: "white" }}>
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: s.color, color: "white" }}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs" style={{ color: s.color, opacity: 0.7 }}>{date}</span>
                        {alert.acknowledged && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(0,0,0,0.06)", color: "var(--muted)" }}>
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: s.color }}>
                        {alert.alert_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-sm" style={{ color: s.color, opacity: 0.8, lineHeight: "1.5" }}>
                        {alert.description}
                      </p>
                      <p className="text-xs mt-1" style={{ color: s.color, opacity: 0.5 }}>
                        Score: {alert.anomaly_score.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {!alert.acknowledged && (
                    <button onClick={() => acknowledge(alert.id)}
                      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(255,255,255,0.6)", color: s.color, border: `1px solid ${s.border}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.9)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.6)"}>
                      Acknowledge
                    </button>
                  )}
                </div>

                {alert.severity === "critical" && !alert.acknowledged && (
                  <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: s.border, color: s.color }}>
                    🆘 Crisis support: call/text <strong>988</strong> or text <strong>HOME to 741741</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
