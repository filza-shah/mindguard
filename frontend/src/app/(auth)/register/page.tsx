"use client";
// frontend/src/app/(auth)/register/page.tsx

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
  username: z.string().min(3, "At least 3 characters").max(50)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, underscores"),
  display_name: z.string().max(200).optional(),
  age: z.coerce.number().min(10).max(25).optional(),
  password: z.string().min(8, "At least 8 characters"),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords do not match", path: ["confirm_password"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await authApi.register({ email: data.email, username: data.username, password: data.password, display_name: data.display_name, age: data.age });
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
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "var(--charcoal)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-sm font-bold"
            style={{ color: "var(--charcoal)" }}>M</div>
          <span className="font-semibold text-white text-sm">MindGuard</span>
        </div>
        <div>
          <h2 className="display-font text-4xl text-white mb-4 leading-tight">
            Start your<br />
            <span style={{ color: "rgba(124,154,146,0.9)" }}>wellness</span><br />
            journey today.
          </h2>
          <div className="space-y-3">
            {[
              "Daily mood check-ins take under 2 minutes",
              "ML-powered pattern detection",
              "Private and encrypted by default",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--sage)", color: "white", fontSize: "10px" }}>✓</div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{f}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Not a medical device. For crisis support, contact 988.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h1 className="display-font text-3xl mb-2" style={{ color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
              Create account
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Free forever. No credit card needed.</p>
          </div>

          {serverError && (
            <div className="rounded-xl px-4 py-3 text-sm mb-5" style={{ background: "#FFE8E8", color: "#C0392B" }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {[
              { name: "email", label: "Email", type: "email", placeholder: "you@example.com", error: errors.email },
              { name: "username", label: "Username", type: "text", placeholder: "yourname", error: errors.username },
              { name: "display_name", label: "Display Name (optional)", type: "text", placeholder: "Your Name", error: undefined },
              { name: "age", label: "Age (optional, 10–25)", type: "number", placeholder: "18", error: errors.age },
              { name: "password", label: "Password", type: "password", placeholder: "Min 8 characters", error: errors.password },
              { name: "confirm_password", label: "Confirm Password", type: "password", placeholder: "Repeat password", error: errors.confirm_password },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--charcoal)" }}>
                  {field.label}
                </label>
                <input
                  {...register(field.name as keyof FormData)}
                  type={field.type}
                  placeholder={field.placeholder}
                  className="input"
                />
                {field.error && (
                  <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                    {field.error.message as string}
                  </p>
                )}
              </div>
            ))}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 mt-2">
              {isSubmitting ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--sage-dark)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
