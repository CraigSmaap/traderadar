"use client";

import { useEffect, useMemo, useState } from "react";

type SessionStatus = {
  label: string;
  tone: string;
};

function getSastNow() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Johannesburg",
    })
  );
}

function minutesUntil(targetHour: number, targetMinute: number, now: Date) {
  const target = new Date(now);
  target.setHours(targetHour, targetMinute, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return Math.floor((target.getTime() - now.getTime()) / 60000);
}

function formatCountdown(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

function getSessionStatus(now: Date): SessionStatus {
  const minutes = now.getHours() * 60 + now.getMinutes();

  const londonOpen = 10 * 60;
  const nyOpen = 15 * 60 + 30;
  const overlapStart = 15 * 60 + 30;
  const overlapEnd = 19 * 60;
  const nyClose = 22 * 60;

  if (minutes >= overlapStart && minutes < overlapEnd) {
    return { label: "London / New York Overlap", tone: "text-emerald-300" };
  }

  if (minutes >= londonOpen && minutes < nyOpen) {
    return { label: "London Session Active", tone: "text-sky-300" };
  }

  if (minutes >= nyOpen && minutes < nyClose) {
    return { label: "New York Session Active", tone: "text-yellow-300" };
  }

  return { label: "Low Liquidity / Pre-Session", tone: "text-zinc-400" };
}

export default function MarketSessionClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const startTimeout = window.setTimeout(() => {
      setNow(getSastNow());
    }, 0);

    const interval = window.setInterval(() => {
      setNow(getSastNow());
    }, 1000);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearInterval(interval);
    };
  }, []);

  const data = useMemo(() => {
    if (!now) {
      return {
        time: "Loading...",
        status: {
          label: "Checking session...",
          tone: "text-zinc-400",
        },
        londonOpen: "—",
        nyOpen: "—",
        londonClose: "—",
        nyClose: "—",
      };
    }

    const status = getSessionStatus(now);

    return {
      time: now.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      status,
      londonOpen: formatCountdown(minutesUntil(10, 0, now)),
      nyOpen: formatCountdown(minutesUntil(15, 30, now)),
      londonClose: formatCountdown(minutesUntil(19, 0, now)),
      nyClose: formatCountdown(minutesUntil(22, 0, now)),
    };
  }, [now]);

  return (
    <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Market Session Clock
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            SAST trading session timing.
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Current South Africa time:{" "}
            <span className="font-semibold text-white">{data.time}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Current Session
          </p>
          <p className={`mt-1 text-sm font-semibold ${data.status.tone}`}>
            {data.status.label}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">London Open</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {data.londonOpen}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">New York Open</p>
          <p className="mt-1 text-xl font-semibold text-white">{data.nyOpen}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">London Close</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {data.londonClose}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">New York Close</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {data.nyClose}
          </p>
        </div>
      </div>
    </section>
  );
}