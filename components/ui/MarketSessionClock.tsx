"use client";

import { useEffect, useMemo, useState } from "react";

type SessionStatus = {
  label: string;
  tone: string;
};

type SastSnapshot = {
  hour: number;
  minute: number;
  second: number;
  weekday: string; // "Mon" | "Tue" | ... | "Sat" | "Sun"
  timeStr: string;
};

function getSastSnapshot(): SastSnapshot {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const dayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  const hour   = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));
  const weekday = dayParts.find(p => p.type === "weekday")?.value ?? "Mon";
  const timeStr = `${get("hour")}:${get("minute")}:${get("second")}`;

  return { hour, minute, second, weekday, timeStr };
}

function minutesUntilSast(targetHour: number, targetMinute: number, snap: SastSnapshot) {
  const nowMinutes  = snap.hour * 60 + snap.minute;
  let   targetMins  = targetHour * 60 + targetMinute;
  if (targetMins <= nowMinutes) targetMins += 24 * 60;
  return targetMins - nowMinutes;
}

function formatCountdown(totalMinutes: number) {
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

function getSessionStatus(snap: SastSnapshot): SessionStatus {
  const isWeekend = snap.weekday === "Sat" || snap.weekday === "Sun";

  if (isWeekend) {
    return { label: "Weekend — Markets Closed (Crypto only)", tone: "text-red-400" };
  }

  const minutes = snap.hour * 60 + snap.minute;

  // Exness SAST session windows
  const londonOpen  = 9  * 60;   // 09:00
  const overlapOpen = 14 * 60;   // 14:00  London + NY both active
  const londonClose = 18 * 60;   // 18:00
  const nyClose     = 23 * 60;   // 23:00

  if (minutes >= overlapOpen && minutes < londonClose) return { label: "London / NY Overlap — Peak Volatility",   tone: "text-emerald-300" };
  if (minutes >= londonOpen  && minutes < overlapOpen) return { label: "London Session Active",                    tone: "text-sky-300"     };
  if (minutes >= londonClose && minutes < nyClose)     return { label: "New York Session Active",                  tone: "text-yellow-300"  };

  return { label: "Low Liquidity — Avoid New Entries", tone: "text-zinc-500" };
}

export default function MarketSessionClock() {
  const [snap, setSnap] = useState<SastSnapshot | null>(null);

  useEffect(() => {
    const t0 = window.setTimeout(() => setSnap(getSastSnapshot()), 0);
    const iv = window.setInterval(() => setSnap(getSastSnapshot()), 1000);
    return () => { window.clearTimeout(t0); window.clearInterval(iv); };
  }, []);

  const data = useMemo(() => {
    if (!snap) {
      return {
        time: "Loading...",
        status: { label: "Checking session...", tone: "text-zinc-400" },
        londonOpen: "—",
        nyOpen: "—",
        londonClose: "—",
        nyClose: "—",
      };
    }

    const status = getSessionStatus(snap);

    return {
      time: snap.timeStr,
      status,
      londonOpen:  formatCountdown(minutesUntilSast(9,  0,  snap)),   // 09:00 SAST
      nyOpen:      formatCountdown(minutesUntilSast(14, 0,  snap)),   // 14:00 SAST
      londonClose: formatCountdown(minutesUntilSast(18, 0,  snap)),   // 18:00 SAST
      nyClose:     formatCountdown(minutesUntilSast(23, 0,  snap)),   // 23:00 SAST
    };
  }, [snap]);

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
          <p className="text-xs text-zinc-500">London Open (09:00)</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {data.londonOpen}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">NY + Overlap (14:00)</p>
          <p className="mt-1 text-xl font-semibold text-white">{data.nyOpen}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">London Close (18:00)</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {data.londonClose}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">NY Close (23:00)</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {data.nyClose}
          </p>
        </div>
      </div>
    </section>
  );
}