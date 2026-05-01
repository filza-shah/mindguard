"use client";
// frontend/src/components/AppShell.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

const NAV = [
  { href: "/dashboard", icon: "▦", label: "Dashboard", desc: "Overview & trends" },
  { href: "/checkin",   icon: "✦", label: "Check In",  desc: "Log today's mood" },
  { href: "/companion", icon: "◎", label: "Companion", desc: "Talk to AI support" },
  { href: "/alerts",    icon: "◉", label: "Alerts",    desc: "Anomaly detections" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); router.push("/login"); };
  const initials = (user?.display_name ?? user?.username ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-full"
        style={{ background: "var(--white)", borderRight: "1px solid var(--border)", zIndex: 40 }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/dashboard" className="flex items-center gap-3 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-deeper))" }}>
              M
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>MindGuard</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Wellness Platform</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1" style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em" }}>
            MAIN MENU
          </p>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all duration-150 group"
                style={{
                  background: active ? "var(--teal-50)" : "transparent",
                  border: active ? "1px solid var(--teal-light)" : "1px solid transparent",
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all"
                  style={{
                    background: active ? "var(--teal)" : "var(--bg)",
                    color: active ? "white" : "var(--muted)",
                  }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none mb-0.5"
                    style={{ color: active ? "var(--teal-deeper)" : "var(--navy)" }}>
                    {item.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
            style={{ background: "var(--bg)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-deeper))" }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--navy)" }}>
                {user?.display_name ?? user?.username}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: "var(--muted)", background: "transparent" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
            <span>→</span> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-8 min-h-screen">
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t flex"
        style={{ background: "var(--white)", borderColor: "var(--border)", zIndex: 40 }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 no-underline transition-colors"
              style={{ color: active ? "var(--teal)" : "var(--muted)" }}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
