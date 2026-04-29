// frontend/src/app/page.tsx
//
// The root "/" page. We immediately redirect based on auth status.
// In Milestone 2 this will check the JWT and redirect accordingly.

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-6">
      <div className="text-center max-w-lg">
        {/* Logo / Hero */}
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl">🧠</span>
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          MindGuard
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Your daily mental wellness companion. Track your mood, understand your
          patterns, and build better habits — one check-in at a time.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="btn-primary">
            Get Started
          </Link>
          <Link href="/login" className="btn-secondary">
            Sign In
          </Link>
        </div>

        {/* Feature bullets */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-sm text-slate-600">
          {[
            { icon: "📊", label: "Pattern Detection" },
            { icon: "🤖", label: "AI Companion" },
            { icon: "🔒", label: "Privacy First" },
          ].map(({ icon, label }) => (
            <div key={label} className="card text-center py-4">
              <span className="text-2xl block mb-1">{icon}</span>
              {label}
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-400">
          MindGuard is not a medical device and does not provide clinical advice.
          If you are in crisis, please contact 988 (Suicide & Crisis Lifeline).
        </p>
      </div>
    </main>
  );
}
