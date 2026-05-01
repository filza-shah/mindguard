"use client";
import { useEffect, useState } from "react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import type { AnomalyAlert } from "@/types";
import AppShell from "@/components/AppShell";

const SEV = {
  low:      { bg: "var(--teal-50)",    border: "var(--teal-light)", color: "var(--teal-deeper)", icon: "ℹ️",  label: "LOW",      bar: "var(--teal)" },
  medium:   { bg: "var(--amber-bg)",   border: "#FDE68A",           color: "#92400E",            icon: "⚠️",  label: "MEDIUM",   bar: "var(--amber)" },
  high:     { bg: "var(--orange-bg)",  border: "#FED7AA",           color: "#C2410C",            icon: "🔶",  label: "HIGH",     bar: "var(--orange)" },
  critical: { bg: "var(--red-bg)",     border: "#FECACA",           color: "#991B1B",            icon: "🚨",  label: "CRITICAL", bar: "var(--red)" },
};

export default function AlertsPage() {
  const [alerts,  setAlerts]  = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<AnomalyAlert[]>("/alerts/")
      .then(r => setAlerts(r.data))
      .catch(e => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const ack = async (id: string) => {
    await apiClient.patch(`/alerts/${id}/acknowledge`);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const unread = alerts.filter(a => !a.acknowledged).length;
  const total  = alerts.length;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 anim-up">
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.03em" }}>
            Anomaly Alerts
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)", maxWidth: "480px", lineHeight: "1.6" }}>
            MindGuard automatically monitors your mood patterns using Z-score analysis.
            Alerts are generated when your mood drops significantly below your personal baseline.
          </p>
        </div>

        {/* Summary bar */}
        {!loading && total > 0 && (
          <div className="card mb-6 anim-up d1">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy)" }}>{total}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>TOTAL</p>
              </div>
              <div className="w-px h-10 self-center" style={{ background: "var(--border)" }} />
              <div className="text-center">
                <p style={{ fontSize: "2rem", fontWeight: 800, color: unread > 0 ? "var(--red)" : "var(--green)" }}>{unread}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>UNREAD</p>
              </div>
              <div className="w-px h-10 self-center" style={{ background: "var(--border)" }} />
              <div className="text-center">
                <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--green)" }}>{total - unread}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>ACKNOWLEDGED</p>
              </div>
              <div className="flex-1" />
              {unread > 0 && (
                <button onClick={async () => {
                  for (const a of alerts.filter(a => !a.acknowledged)) await ack(a.id);
                }} className="btn-ghost py-2 px-4 text-xs">
                  Mark all read
                </button>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-3"
                style={{ border: "3px solid var(--teal)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading alerts…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
            ⚠ {error}
          </div>
        )}

        {!loading && total === 0 && (
          <div className="card text-center py-16 anim-up">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-bold text-lg mb-2" style={{ color: "var(--navy)" }}>All clear</h3>
            <p className="text-sm" style={{ color: "var(--muted)", maxWidth: "300px", margin: "0 auto", lineHeight: "1.6" }}>
              No anomalies detected. Your mood patterns are within your normal range.
              Keep checking in daily to build a reliable baseline.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const s = SEV[alert.severity as keyof typeof SEV];
            const date = new Date(alert.created_at).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            });

            return (
              <div key={alert.id}
                className="rounded-2xl overflow-hidden anim-up transition-opacity"
                style={{
                  border: `1px solid ${s.border}`,
                  background: s.bg,
                  opacity: alert.acknowledged ? 0.55 : 1,
                  animationDelay: `${i * 0.06}s`,
                }}>

                {/* Severity colour bar on top */}
                <div className="h-1" style={{ background: s.bar }} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: "rgba(255,255,255,0.6)" }}>
                        {s.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="tag text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: s.bar, color: "white" }}>
                            {s.label}
                          </span>
                          <span className="text-xs" style={{ color: s.color, opacity: 0.7 }}>{date}</span>
                          {alert.acknowledged && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-lg"
                              style={{ background: "rgba(0,0,0,0.06)", color: "var(--muted)" }}>
                              ✓ Acknowledged
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold mb-1" style={{ color: s.color }}>
                          {alert.alert_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </p>
                        <p className="text-sm" style={{ color: s.color, opacity: 0.85, lineHeight: "1.6" }}>
                          {alert.description}
                        </p>
                        <p className="text-xs mt-2 font-medium" style={{ color: s.color, opacity: 0.5 }}>
                          Anomaly score: {alert.anomaly_score.toFixed(3)}
                        </p>
                      </div>
                    </div>

                    {!alert.acknowledged && (
                      <button onClick={() => ack(alert.id)}
                        className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                        style={{ background: "rgba(255,255,255,0.7)", color: s.color, border: `1px solid ${s.border}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "white"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.7)"}>
                        Acknowledge ✓
                      </button>
                    )}
                  </div>

                  {alert.severity === "critical" && !alert.acknowledged && (
                    <div className="mt-4 pt-4 text-xs font-medium"
                      style={{ borderTop: `1px solid ${s.border}`, color: s.color }}>
                      🆘 If you are in crisis, please reach out:
                      Call/text <strong>988</strong> · Text <strong>HOME to 741741</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
