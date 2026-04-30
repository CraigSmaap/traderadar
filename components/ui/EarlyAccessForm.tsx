"use client";

import { useState } from "react";

export default function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        source: "homepage",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      setStatus("error");
      setMessage(data.message || "Could not join early access.");
      return;
    }

    setStatus("success");
    setMessage("You’re on the early access list.");
    setEmail("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Join Early Access
      </p>

      <h3 className="mt-2 text-xl font-semibold text-white">
        Get launch updates and free alerts.
      </h3>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="Enter your email"
          className="min-h-12 flex-1 rounded-2xl border border-zinc-800 bg-black px-4 text-sm text-white outline-none focus:border-emerald-400"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Joining..." : "Join Early Access"}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-3 text-sm ${
            status === "success" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {message}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-zinc-500">
        No spam. Just launch updates, beginner trade alerts, and early access
        offers.
      </p>
    </form>
  );
}