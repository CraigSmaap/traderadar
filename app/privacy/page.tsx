"use client";

import Header from "@/components/layout/Header";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-4xl px-6 py-10">
        {/* Back Button */}
        <Link
          href="/live"
          className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-400 mb-6"
        >
          ← Back to Live
        </Link>

        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="text-zinc-400 mb-4">
          We respect your privacy and are committed to protecting your personal
          information in accordance with applicable data protection laws,
          including the Protection of Personal Information Act (POPIA).
        </p>

        {/* SECTION 1 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          1. Information We Collect
        </h2>
        <p className="text-zinc-400">
          We collect basic personal information such as your email address,
          account details, and usage activity necessary to operate the platform.
        </p>

        {/* SECTION 2 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          2. How We Use Your Information
        </h2>
        <p className="text-zinc-400">
          Your data is used to provide, maintain, and improve TradeRadar
          services, including account access, signal delivery, analytics, and
          platform performance.
        </p>

        {/* SECTION 3 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          3. Data Storage & Security
        </h2>
        <p className="text-zinc-400">
          Your information is securely stored using trusted infrastructure such
          as Supabase. We take reasonable technical and organizational measures
          to protect your data against unauthorized access, loss, or misuse.
        </p>

        {/* SECTION 4 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          4. Data Sharing
        </h2>
        <p className="text-zinc-400">
          We do not sell your personal information. Data may only be shared with
          trusted service providers (such as authentication or hosting services)
          strictly for platform operation.
        </p>

        {/* SECTION 5 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          5. Cookies & Tracking
        </h2>
        <p className="text-zinc-400">
          TradeRadar may use cookies or similar technologies to improve user
          experience, maintain sessions, and analyze platform usage.
        </p>

        {/* SECTION 6 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          6. Your Rights (POPIA)
        </h2>
        <p className="text-zinc-400">
          In accordance with POPIA, you have the right to access, correct, or
          request deletion of your personal data. You may also object to how your
          data is processed.
        </p>

        {/* SECTION 7 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          7. Data Retention
        </h2>
        <p className="text-zinc-400">
          We retain your information only for as long as necessary to provide
          services or comply with legal obligations.
        </p>

        {/* SECTION 8 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          8. Changes to This Policy
        </h2>
        <p className="text-zinc-400">
          This policy may be updated from time to time. Continued use of the
          platform indicates acceptance of any changes.
        </p>

        {/* FOOTER */}
        <p className="text-xs text-zinc-600 mt-10">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </section>
    </main>
  );
}