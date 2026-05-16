"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";

type Step = "idle" | "enrolling" | "verifying" | "done";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function checkMfa() {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp ?? [];
      setMfaEnabled(totp.some((f) => f.status === "verified"));
    }
    checkMfa();
  }, [supabase]);

  async function startEnrollment() {
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setLoading(false);

    if (err || !data) {
      setError(err?.message ?? "Enrollment failed");
      return;
    }

    const uri = data.totp.uri;
    const dataUrl = await QRCode.toDataURL(uri, { width: 220, margin: 2 });

    setFactorId(data.id);
    setQrDataUrl(dataUrl);
    setSecret(data.totp.secret);
    setStep("enrolling");
  }

  async function verifyEnrollment() {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");

    const { error: challengeErr, data: challengeData } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeErr) {
      setError(challengeErr.message);
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    setLoading(false);

    if (verifyErr) {
      setError("Incorrect code — try again");
      setCode("");
      return;
    }

    setMfaEnabled(true);
    setStep("done");
    setSuccess("2FA is now active on your account.");
  }

  async function disableMfa() {
    setLoading(true);
    setError("");

    const { data } = await supabase.auth.mfa.listFactors();
    const factors = data?.totp ?? [];

    for (const factor of factors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    setLoading(false);
    setMfaEnabled(false);
    setStep("idle");
    setSuccess("2FA has been removed from your account.");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Account Settings
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">Security</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Protect your account with two-factor authentication.
        </p>

        <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Two-Factor Authentication</p>
              <p className="mt-1 text-sm text-zinc-400">
                {mfaEnabled
                  ? "Your account is protected with an authenticator app."
                  : "Add a second layer of security to your account."}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                mfaEnabled
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {mfaEnabled ? "Active" : "Off"}
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </p>
          )}

          {step === "idle" && !mfaEnabled && (
            <button
              onClick={startEnrollment}
              disabled={loading}
              className="mt-6 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Enable 2FA"}
            </button>
          )}

          {step === "enrolling" && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-zinc-300">
                Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>, then enter the 6-digit code below.
              </p>

              {qrDataUrl && (
                <div className="flex justify-center rounded-2xl border border-zinc-800 bg-white p-4">
                  <img src={qrDataUrl} alt="2FA QR Code" width={220} height={220} />
                </div>
              )}

              <div>
                <p className="mb-2 text-xs text-zinc-500">Can&apos;t scan? Enter this secret manually:</p>
                <p className="rounded-xl border border-zinc-800 bg-black px-4 py-3 font-mono text-sm tracking-widest text-zinc-300">
                  {secret}
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-white outline-none focus:border-emerald-400"
                />
                <button
                  onClick={verifyEnrollment}
                  disabled={loading || code.length !== 6}
                  className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? "..." : "Verify"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm font-semibold text-emerald-300">
                2FA enabled — you&apos;ll be asked for a code on every login.
              </p>
            </div>
          )}

          {mfaEnabled && step !== "enrolling" && (
            <button
              onClick={disableMfa}
              disabled={loading}
              className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Remove 2FA"}
            </button>
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="mt-6 text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← Back
        </button>
      </section>
    </main>
  );
}
