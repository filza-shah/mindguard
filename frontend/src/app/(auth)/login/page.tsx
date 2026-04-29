// frontend/src/app/(auth)/login/page.tsx
//
// The (auth) folder name (with parentheses) is a Next.js "route group".
// It groups the login and register pages together without affecting the URL.
// The URL is still /login, not /(auth)/login.
//
// We use react-hook-form + zod for form handling:
// - react-hook-form: manages form state, validation, submission — no re-renders on every keystroke
// - zod: defines a validation schema — same approach we used with Pydantic on the backend

"use client"; // This page uses browser APIs (localStorage) — must be a Client Component

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

// Validation schema — zod checks this before the form submits
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,       // connects <input> to the form
    handleSubmit,   // wraps your submit handler with validation
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      // 1. Get the JWT token
      const tokenRes = await authApi.login(data.email, data.password);

      // 2. Store the token (the interceptor will use it for future requests)
      localStorage.setItem("access_token", tokenRes.access_token);

      // 3. Fetch the user profile
      const user = await authApi.getMe();

      // 4. Save to global Zustand store
      setAuth(user, tokenRes.access_token);

      // 5. Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-3 shadow">
              <span className="text-2xl">🧠</span>
            </div>
            <span className="text-xl font-bold text-slate-800">MindGuard</span>
          </Link>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to your account</p>

          {/* Server error banner */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-6"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
