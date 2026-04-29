"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
    display_name: z.string().max(200).optional(),
    age: z.coerce.number().min(10).max(25).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
        display_name: data.display_name,
        age: data.age,
      });

      // Auto-login after register
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-3 shadow">
              <span className="text-2xl">🧠</span>
            </div>
            <span className="text-xl font-bold text-slate-800">MindGuard</span>
          </Link>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-6">Start tracking your wellbeing today</p>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input {...register("email")} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input {...register("username")} type="text" placeholder="yourname" className="input" />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Display Name <span className="text-slate-400">(optional)</span>
              </label>
              <input {...register("display_name")} type="text" placeholder="Your Name" className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Age <span className="text-slate-400">(optional, 10–25)</span>
              </label>
              <input {...register("age")} type="number" placeholder="18" className="input" />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input {...register("password")} type="password" placeholder="Min 8 characters" className="input" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input {...register("confirm_password")} type="password" placeholder="Repeat password" className="input" />
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-6">
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4">
            By creating an account you agree that MindGuard is not a medical device and does not
            provide clinical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
