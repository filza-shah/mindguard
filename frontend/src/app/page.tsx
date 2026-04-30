// frontend/src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--charcoal)" }}>
            <span className="text-white text-sm">M</span>
          </div>
          <span className="font-semibold text-base" style={{ color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
            MindGuard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary py-2 px-4 text-sm">Sign in</Link>
          <Link href="/register" className="btn-primary py-2 px-4 text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{ background: "var(--sage-light)", color: "var(--sage-dark)", border: "1px solid rgba(124,154,146,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--sage)" }} />
          Built for youth mental health
        </div>

        <h1 className="display-font text-6xl md:text-7xl mb-6 leading-tight"
          style={{ color: "var(--charcoal)", letterSpacing: "-0.03em" }}>
          Understand your
          <span className="italic" style={{ color: "var(--sage)" }}> patterns.</span>
          <br />Build better habits.
        </h1>

        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--muted)", lineHeight: "1.7" }}>
          MindGuard uses machine learning to detect behavioural patterns in your
          daily mood check-ins and surface insights before small struggles become big ones.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="btn-primary py-3 px-6 text-base">
            Start tracking free →
          </Link>
          <Link href="/login" className="btn-secondary py-3 px-6 text-base">
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: "📊",
              title: "Pattern Detection",
              desc: "Z-score anomaly detection flags when your mood deviates significantly from your personal baseline.",
              tag: "ML-powered",
            },
            {
              icon: "✍️",
              title: "Sentiment Analysis",
              desc: "A custom-trained NLP classifier analyses your journal entries to understand emotional tone.",
              tag: "Custom model",
            },
            {
              icon: "🤖",
              title: "AI Companion",
              desc: "A supportive conversational AI available whenever you need to talk — empathetic, not clinical.",
              tag: "Claude-powered",
            },
          ].map((f, i) => (
            <div key={i} className="card animate-fade-up" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-xl"
                style={{ background: "var(--sage-light)" }}>
                {f.icon}
              </div>
              <div className="text-xs font-medium mb-2 px-2 py-0.5 rounded-full inline-block"
                style={{ background: "var(--stone)", color: "var(--muted)" }}>
                {f.tag}
              </div>
              <h3 className="font-semibold text-base mb-2" style={{ color: "var(--charcoal)", letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--muted)", lineHeight: "1.6" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="rounded-2xl p-8 grid grid-cols-3 gap-8 text-center"
          style={{ background: "var(--charcoal)" }}>
          {[
            { value: "95%", label: "Classifier accuracy" },
            { value: "< 10ms", label: "Inference time" },
            { value: "3", label: "Detection algorithms" },
          ].map((s, i) => (
            <div key={i}>
              <div className="display-font text-4xl mb-1" style={{ color: "white" }}>{s.value}</div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t pb-8 pt-6 text-center text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        MindGuard is not a medical device and does not provide clinical advice.
        If you are in crisis, please contact{" "}
        <span className="font-medium" style={{ color: "var(--charcoal)" }}>988</span> or text{" "}
        <span className="font-medium" style={{ color: "var(--charcoal)" }}>HOME to 741741</span>.
      </footer>
    </main>
  );
}
