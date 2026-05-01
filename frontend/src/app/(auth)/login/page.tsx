"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type F = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    setErr(null);
    try {
      const token = await authApi.login(data.email, data.password);
      localStorage.setItem("access_token", token.access_token);
      const user = await authApi.getMe();
      setAuth(user, token.access_token);
      router.push("/dashboard");
    } catch (e) { setErr(getApiErrorMessage(e)); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, var(--navy) 0%, var(--navy-800) 60%, #0D3D3A 100%)" }}>

        {/* Background decorations */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-10"
          style={{ background: "var(--teal)", filter: "blur(80px)" }} />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: "var(--teal)", filter: "blur(60px)" }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: "var(--teal)" }}>M</div>
            <span className="text-white font-bold text-base">MindGuard</span>
          </div>

          <div>
            <h1 className="serif mb-6" style={{ fontSize: "3.2rem", color: "white", fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Welcome back.<br />
              <span style={{ color: "var(--teal)" }}>Your data is waiting.</span>
            </h1>
            <p className="mb-10 text-base" style={{ color: "rgba(255,255,255,0.55)", lineHeight: "1.75" }}>
              Sign in to view your mood patterns, check-in history, and AI companion.
            </p>

            {/* Testimonial / feature highlight */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#FBBF24" }}>★</span>)}
              </div>
              <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.7" }}>
                &ldquo;MindGuard helped me notice I was burning out two weeks before I would have crashed. The trend detection is genuinely useful.&rdquo;
              </p>
              <p className="text-xs mt-3 font-semibold" style={{ color: "var(--teal)" }}>— University student, age 21</p>
            </div>
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Not a medical device. For crisis: call/text 988
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md anim-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--teal)" }}>M</div>
            <span className="font-bold" style={{ color: "var(--navy)" }}>MindGuard</span>
          </div>

          <div className="mb-8">
            <h2 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.03em" }}>
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold no-underline" style={{ color: "var(--teal-dark)" }}>
                Create one free →
              </Link>
            </p>
          </div>

          {err && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
              ⚠ {err}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>
                Email address
              </label>
              <input {...register("email")} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--red)" }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>
                Password
              </label>
              <input {...register("password")} type="password" placeholder="••••••••" className="input" />
              {errors.password && <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--red)" }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full"
              style={{ padding: "13px", fontSize: "0.9375rem", marginTop: "8px" }}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in →"}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
              Your data is encrypted and private. We never share your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
