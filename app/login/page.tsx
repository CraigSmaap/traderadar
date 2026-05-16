"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot" | "mfa";

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
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSuccess("");
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/live` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
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

    // Check if MFA is required
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.find((f) => f.status === "verified");

    if (totpFactor) {
      setMfaFactorId(totpFactor.id);
      setMode("mfa");
      setLoading(false);
      return;
    }

    router.push("/live");
    router.refresh();
  }

  async function handleMfa() {
    if (mfaCode.length !== 6) return;
    setLoading(true);
    setError("");

    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId: mfaFactorId });

    if (challengeErr) {
      setError(challengeErr.message);
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode,
    });

    setLoading(false);

    if (verifyErr) {
      setError("Incorrect code — try again");
      setMfaCode("");
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
        : mode === "mfa"
          ? "Two-factor auth"
          : "Reset password";

  const subheading =
    mode === "login"
      ? "Access your live trade plans and signals."
      : mode === "signup"
        ? "Full access for 7 days — no credit card needed."
        : mode === "mfa"
          ? "Enter the 6-digit code from your authenticator app."
          : "Enter your email and we'll send a reset link.";

  const buttonLabel = loading
    ? "Please wait..."
    : mode === "login"
      ? "Login"
      : mode === "signup"
        ? "Create account"
        : mode === "mfa"
          ? "Verify"
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

          {/* Google */}
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs text-zinc-600">or</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
            </>
          )}

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

          {/* MFA input */}
          {mode === "mfa" && (
            <div className="mt-4 flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white outline-none focus:border-emerald-400"
                autoFocus
              />
              <button
                onClick={handleMfa}
                disabled={loading || mfaCode.length !== 6}
                className="rounded-xl bg-emerald-400 py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-60"
              >
                {buttonLabel}
              </button>
            </div>
          )}

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
