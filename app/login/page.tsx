"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "forgot") {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      setLoading(false);
      if (err) {
        setError(err.message);
      } else {
        setSuccess("Password reset link sent — check your email.");
      }
      return;
    }

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup") {
      if (result.data.session) {
        router.push("/live");
        router.refresh();
        return;
      }
      setSuccess("Account created! Check your email to confirm, then log in.");
      switchMode("login");
      return;
    }

    router.push("/live");
    router.refresh();
  }

  const heading =
    mode === "login"
      ? "Welcome back"
      : mode === "signup"
        ? "Start your free trial"
        : "Reset password";

  const subheading =
    mode === "login"
      ? "Access your live trade plans and signals."
      : mode === "signup"
        ? "Full access for 7 days — no credit card needed."
        : "Enter your email and we'll send a reset link.";

  const buttonLabel = loading
    ? "Please wait..."
    : mode === "login"
      ? "Login"
      : mode === "signup"
        ? "Create account"
        : "Send reset link";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 text-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/traderadar-mark.svg"
              alt="TradeRadar"
              width={44}
              height={44}
              priority
              className="h-11 w-11"
            />
            <div>
              <div className="text-2xl font-extrabold tracking-[-0.03em] text-white">
                Trade<span className="text-emerald-400">Radar</span>
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Beginner Trading Engine
              </div>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_40%),linear-gradient(135deg,rgba(24,24,27,0.98)_0%,rgba(6,6,8,1)_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="mb-6">
            {mode === "signup" ? (
              <p className="mb-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                7-day free trial · no card needed
              </p>
            ) : null}
            <h1 className="text-2xl font-bold text-white">{heading}</h1>
            <p className="mt-1 text-sm text-zinc-400">{subheading}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400"
              />
            </label>

            {mode !== "forgot" ? (
              <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                Password
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 transition hover:text-zinc-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-emerald-400 py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buttonLabel}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 flex flex-col gap-2 text-center text-sm text-zinc-500">
            {mode === "login" ? (
              <>
                <button
                  onClick={() => switchMode("signup")}
                  className="transition hover:text-white"
                >
                  No account? Start free trial
                </button>
                <button
                  onClick={() => switchMode("forgot")}
                  className="transition hover:text-white"
                >
                  Forgot password?
                </button>
              </>
            ) : mode === "signup" ? (
              <button
                onClick={() => switchMode("login")}
                className="transition hover:text-white"
              >
                Already have an account? Login
              </button>
            ) : (
              <button
                onClick={() => switchMode("login")}
                className="transition hover:text-white"
              >
                Back to login
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link href="/" className="transition hover:text-zinc-400">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
