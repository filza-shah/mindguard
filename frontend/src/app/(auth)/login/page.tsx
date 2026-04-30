"use client";
// frontend/src/app/(auth)/login/page.tsx

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
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const tokenRes = await authApi.login(data.email, data.password);
      localStorage.setItem("access_token", tokenRes.access_token);
      const user = await authApi.getMe();
      setAuth(user, tokenRes.access_token);
      router.push("/dashboard");
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "var(--charcoal)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-sm font-bold"
            style={{ color: "var(--charcoal)" }}>M</div>
          <span className="font-semibold text-white text-sm">MindGuard</span>
        </div>
        <div>
          <h2 className="display-font text-4xl text-white mb-4 leading-tight">
            Your daily<br />
            <span style={{ color: "rgba(124,154,146,0.9)" }}>mental wellness</span><br />
            companion.
          </h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", lineHeight: "1.7" }}>
            Track your mood patterns, detect early warning signs, and access
            AI-powered support — all in one private, secure place.
          </p>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Not a medical device. For crisis support, contact 988.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h1 className="display-font text-3xl mb-2" style={{ color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Sign in to your account</p>
          </div>

          {serverError && (
            <div className="rounded-xl px-4 py-3 text-sm mb-5" style={{ background: "#FFE8E8", color: "#C0392B" }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--charcoal)" }}>
                Email
              </label>
              <input {...register("email")} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--charcoal)" }}>
                Password
              </label>
              <input {...register("password")} type="password" placeholder="••••••••" className="input" />
              {errors.password && <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 mt-2">
              {isSubmitting ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium" style={{ color: "var(--sage-dark)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
