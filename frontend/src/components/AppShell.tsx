"use client";
// frontend/src/components/AppShell.tsx
//
// Shared layout for all authenticated pages.
// Sidebar on desktop, bottom nav on mobile.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "◈", label: "Dashboard" },
  { href: "/checkin", icon: "✦", label: "Check In" },
  { href: "/companion", icon: "◎", label: "Companion" },
  { href: "/alerts", icon: "◉", label: "Alerts" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 fixed top-0 left-0 h-full"
        style={{ background: "white", borderRight: "1px solid var(--border)" }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--charcoal)" }}>M</div>
            <span className="font-semibold text-sm" style={{ color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
              MindGuard
            </span>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ background: "var(--sage)" }}>
              {(user?.display_name ?? user?.username ?? "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--charcoal)" }}>
                {user?.display_name ?? user?.username}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? "var(--sage-light)" : "transparent",
                  color: active ? "var(--sage-dark)" : "var(--muted)",
                }}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all duration-150"
            style={{ color: "var(--muted)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--stone)";
              (e.currentTarget as HTMLElement).style.color = "var(--charcoal)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--muted)";
            }}>
            <span>⎋</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t"
        style={{ background: "white", borderColor: "var(--border)" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-all"
              style={{ color: active ? "var(--sage-dark)" : "var(--muted)" }}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
