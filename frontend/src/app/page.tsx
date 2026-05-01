// frontend/src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: "rgba(255,255,255,0.85)", borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-deeper))" }}>
              M
            </div>
            <span className="font-bold text-base" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>
              MindGuard
            </span>
            <span className="tag tag-teal text-xs">Beta</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost py-2 px-4">Sign in</Link>
            <Link href="/register" className="btn-primary py-2 px-4">Get started free →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center max-w-3xl mx-auto">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 anim-up"
            style={{ background: "var(--teal-50)", border: "1px solid var(--teal-light)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--teal)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--teal-deeper)" }}>
              Built for young people aged 10–25
            </span>
          </div>

          <h1 className="serif anim-up d1 mb-6"
            style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--navy)" }}>
            Understand your mind.<br />
            <span style={{ color: "var(--teal)" }}>Before it overwhelms you.</span>
          </h1>

          <p className="text-lg mb-10 anim-up d2"
            style={{ color: "var(--slate)", lineHeight: "1.75", maxWidth: "560px", margin: "0 auto 40px" }}>
            MindGuard uses machine learning to detect patterns in your daily mood
            check-ins and surface early warning signs — so you can get support
            before small struggles become big problems.
          </p>

          <div className="flex items-center justify-center gap-3 anim-up d3">
            <Link href="/register" className="btn-primary" style={{ fontSize: "1rem", padding: "13px 28px" }}>
              Start tracking free →
            </Link>
            <Link href="/login" className="btn-ghost" style={{ fontSize: "1rem", padding: "13px 28px" }}>
              Sign in
            </Link>
          </div>

          <p className="text-xs mt-4 anim-up d4" style={{ color: "var(--muted)" }}>
            No credit card required · Free forever · Private &amp; encrypted
          </p>
        </div>

        {/* ── App Preview Card ── */}
        <div className="mt-16 anim-up d4">
          <div className="rounded-2xl overflow-hidden border"
            style={{ background: "var(--white)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>

            {/* Mock browser bar */}
            <div className="px-4 py-3 border-b flex items-center gap-2"
              style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md flex items-center px-3"
                style={{ background: "var(--border)", maxWidth: "300px" }}>
                <span className="text-xs" style={{ color: "var(--muted)" }}>mindguard.app/dashboard</span>
              </div>
            </div>

            {/* Mock dashboard */}
            <div className="p-6" style={{ background: "var(--bg)" }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>GOOD MORNING</p>
                  <p className="text-lg font-bold" style={{ color: "var(--navy)" }}>Your Dashboard 👋</p>
                </div>
                <div className="btn-primary py-2 px-4 text-xs cursor-default">+ Check In</div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "7-Day Avg Mood", value: "3.8", unit: "/ 5", color: "var(--teal)" },
                  { label: "Check-in Streak", value: "12", unit: "days", color: "var(--orange)" },
                  { label: "Trend", value: "📈", unit: "Improving", color: "var(--green)" },
                  { label: "Total Check-ins", value: "47", unit: "", color: "var(--navy)" },
                ].map((s) => (
                  <div key={s.label} className="card p-4">
                    <p className="text-xs mb-2" style={{ color: "var(--muted)", fontWeight: 600 }}>{s.label}</p>
                    <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}
                      <span className="text-xs font-normal ml-1" style={{ color: "var(--muted)" }}>{s.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Mock chart */}
              <div className="card p-4">
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>30-Day Mood Trend</p>
                <div className="flex items-end gap-1 h-16">
                  {[3,2,3,4,3,4,4,5,4,3,4,5,4,4,5,4,3,4,4,5,4,5,4,5,5,4,5,4,5,5].map((v, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${v * 20}%`,
                        background: v >= 4
                          ? "linear-gradient(to top, var(--teal-dark), var(--teal))"
                          : v === 3
                          ? "var(--border-strong)"
                          : "var(--red)",
                        opacity: 0.8,
                      }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="label mb-3">HOW IT WORKS</p>
          <h2 className="serif text-4xl mb-4" style={{ color: "var(--navy)", fontWeight: 400 }}>
            Three steps to better self-awareness
          </h2>
          <p className="text-base" style={{ color: "var(--slate)", maxWidth: "480px", margin: "0 auto" }}>
            MindGuard works quietly in the background — you just check in daily and let the ML do the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              icon: "✍️",
              title: "Check in daily",
              desc: "Takes 60 seconds. Rate your mood, energy, sleep, and optionally add a private journal note. That's it.",
              color: "var(--teal)",
            },
            {
              step: "02",
              icon: "🧠",
              title: "ML analyses your patterns",
              desc: "Our custom NLP sentiment classifier and Z-score anomaly detector analyse your data in real-time.",
              color: "var(--navy)",
            },
            {
              step: "03",
              icon: "🔔",
              title: "Get early warnings",
              desc: "If your mood drops significantly below your personal baseline, an alert is generated so you can act early.",
              color: "var(--orange)",
            },
          ].map((item, i) => (
            <div key={i} className="card p-7 anim-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-xs font-bold px-2 py-1 rounded-md"
                  style={{ background: "var(--bg)", color: "var(--muted)" }}>
                  STEP {item.step}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--slate)", lineHeight: "1.7" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-10 pb-20">
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--navy)" }}>
          <div className="p-10 md:p-14">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="tag tag-teal mb-4">FEATURES</p>
                <h2 className="serif text-white mb-6"
                  style={{ fontSize: "2.5rem", fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                  Built with real ML.<br />Not just a mood tracker.
                </h2>
                <p className="mb-8" style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.75" }}>
                  Most wellness apps are just digital journals. MindGuard is different —
                  it runs a custom-trained NLP model on your notes and Z-score statistics
                  on your mood data to actually detect problems early.
                </p>
                <Link href="/register" className="btn-primary inline-flex">
                  Try it free →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🤖", title: "AI Companion", desc: "Chat with an empathetic AI whenever you need support" },
                  { icon: "📊", title: "Anomaly Detection", desc: "Z-score alerts when mood deviates from your baseline" },
                  { icon: "🧬", title: "Custom NLP Model", desc: "95.2% accuracy sentiment classifier trained on mental health data" },
                  { icon: "🔒", title: "Private & Encrypted", desc: "Notes encrypted at rest — even we can't read them" },
                ].map((f) => (
                  <div key={f.title} className="p-5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span className="text-2xl block mb-3">{f.icon}</span>
                    <p className="font-semibold text-white text-sm mb-1">{f.title}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-3 gap-6">
          {[
            { value: "95.2%", label: "Sentiment classifier accuracy", icon: "🎯" },
            { value: "< 10ms", label: "ML inference time per check-in", icon: "⚡" },
            { value: "14 / 14", label: "Integration tests passing", icon: "✅" },
          ].map((s) => (
            <div key={s.label} className="card text-center py-8">
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="serif mb-2" style={{ fontSize: "2.5rem", color: "var(--teal)", fontWeight: 400 }}>
                {s.value}
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl p-14 text-center"
          style={{ background: "linear-gradient(135deg, var(--teal-50), white)", border: "1px solid var(--teal-light)" }}>
          <h2 className="serif text-4xl mb-4" style={{ color: "var(--navy)", fontWeight: 400 }}>
            Ready to understand yourself better?
          </h2>
          <p className="mb-8 text-base" style={{ color: "var(--slate)", maxWidth: "400px", margin: "0 auto 32px" }}>
            Join MindGuard today. Free forever. Your data stays private.
          </p>
          <Link href="/register" className="btn-primary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
            Create your free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--teal)" }}>M</div>
            <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>MindGuard</span>
          </div>
          <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
            Not a medical device. For crisis support: call/text <strong style={{ color: "var(--navy)" }}>988</strong> or text <strong style={{ color: "var(--navy)" }}>HOME to 741741</strong>
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>© 2026 MindGuard</p>
        </div>
      </footer>
    </div>
  );
}
