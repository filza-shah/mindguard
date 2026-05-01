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
  username: z.string().min(3, "At least 3 characters").max(50).regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  display_name: z.string().max(200).optional(),
  age: z.coerce.number().min(10, "Must be at least 10").max(25, "Must be 25 or under").optional(),
  password: z.string().min(8, "At least 8 characters"),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] });
type F = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    setErr(null);
    try {
      await authApi.register({ email: data.email, username: data.username, password: data.password, display_name: data.display_name, age: data.age });
      const token = await authApi.login(data.email, data.password);
      localStorage.setItem("access_token", token.access_token);
      const user = await authApi.getMe();
      setAuth(user, token.access_token);
      router.push("/dashboard");
    } catch (e) { setErr(getApiErrorMessage(e)); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, var(--navy) 0%, var(--navy-800) 60%, #0D3D3A 100%)" }}>
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-10"
          style={{ background: "var(--teal)", filter: "blur(100px)" }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: "var(--teal)" }}>M</div>
            <span className="text-white font-bold text-base">MindGuard</span>
          </div>

          <div>
            <h1 className="serif mb-6" style={{ fontSize: "3rem", color: "white", fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Start your wellness<br />
              <span style={{ color: "var(--teal)" }}>journey today.</span>
            </h1>
            <div className="space-y-4">
              {[
                { icon: "✓", text: "Daily check-ins take under 2 minutes" },
                { icon: "✓", text: "ML detects patterns you might miss" },
                { icon: "✓", text: "AI companion available 24/7" },
                { icon: "✓", text: "All data encrypted and private" },
                { icon: "✓", text: "Completely free, no credit card" },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--teal)", color: "white" }}>{f.icon}</div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Not a medical device. For crisis: call/text 988
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8 anim-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--teal)" }}>M</div>
            <span className="font-bold" style={{ color: "var(--navy)" }}>MindGuard</span>
          </div>

          <div className="mb-8">
            <h2 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.03em" }}>
              Create your account
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold no-underline" style={{ color: "var(--teal-dark)" }}>Sign in →</Link>
            </p>
          </div>

          {err && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
              ⚠ {err}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {[
              { name: "email" as const, label: "Email address", type: "email", placeholder: "you@example.com", required: true },
              { name: "username" as const, label: "Username", type: "text", placeholder: "yourname (lowercase, no spaces)", required: true },
              { name: "display_name" as const, label: "Display name", type: "text", placeholder: "How should we call you? (optional)", required: false },
              { name: "age" as const, label: "Age (10–25, optional)", type: "number", placeholder: "18", required: false },
              { name: "password" as const, label: "Password", type: "password", placeholder: "Minimum 8 characters", required: true },
              { name: "confirm_password" as const, label: "Confirm password", type: "password", placeholder: "Repeat your password", required: true },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--navy)" }}>
                  {field.label}
                  {!field.required && <span className="font-normal ml-1" style={{ color: "var(--muted)" }}>(optional)</span>}
                </label>
                <input {...register(field.name)} type={field.type} placeholder={field.placeholder} className="input" />
                {errors[field.name] && (
                  <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--red)" }}>
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            ))}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full"
              style={{ padding: "13px", fontSize: "0.9375rem", marginTop: "8px" }}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Create free account →"}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: "var(--muted)" }}>
            By creating an account you acknowledge MindGuard is not a medical device.
          </p>
        </div>
      </div>
    </div>
  );
}
