"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import FloatingTradeButton from "@/components/ui/FloatingTradeButton";

type PlaybookCard = {
  id: string;
  title: string;
  tradeCall: "LONG" | "SHORT" | "WATCH" | "DEFENSIVE";
  strength: "Weak" | "Moderate" | "Strong";
  confidence: "Low" | "Medium" | "High";
  summary: string;
  meaning: string;
  action: string;
  chartType:
    | "breakout_up"
    | "breakdown_down"
    | "range"
    | "early_up"
    | "early_down"
    | "risk_off";
};

const playbookCards: PlaybookCard[] = [
  {
    id: "long-strong-high",
    title: "Bullish breakout setup",
    tradeCall: "LONG",
    strength: "Strong",
    confidence: "High",
    summary: "Clear upside momentum with strong alignment.",
    meaning: "This is one of the strongest long conditions on TradeRadar.",
    action: "Best used when price is already moving upward with conviction.",
    chartType: "breakout_up",
  },
  {
    id: "short-strong-medium",
    title: "Bearish breakdown setup",
    tradeCall: "SHORT",
    strength: "Strong",
    confidence: "Medium",
    summary: "Downside momentum is active and tradable.",
    meaning: "This suggests sellers are in control and downside pressure is building.",
    action: "Useful when TradeRadar shows strong bearish movement and the move is already underway.",
    chartType: "breakdown_down",
  },
  {
    id: "watch-moderate-low",
    title: "Developing setup",
    tradeCall: "WATCH",
    strength: "Moderate",
    confidence: "Low",
    summary: "Movement exists, but confirmation is incomplete.",
    meaning: "TradeRadar sees potential, but not enough evidence to push a full long or short call.",
    action: "Best used as a wait-and-see condition until momentum becomes clearer.",
    chartType: "range",
  },
  {
    id: "defensive-strong-medium",
    title: "Risk-off condition",
    tradeCall: "DEFENSIVE",
    strength: "Strong",
    confidence: "Medium",
    summary: "Capital preservation matters more than aggression.",
    meaning: "This usually appears when market uncertainty is elevated or traders are rotating into safety.",
    action: "Use caution. Avoid forcing trades just because something is moving.",
    chartType: "risk_off",
  },
  {
    id: "long-moderate-medium",
    title: "Early bullish trend",
    tradeCall: "LONG",
    strength: "Moderate",
    confidence: "Medium",
    summary: "Bullish momentum is forming but not fully mature yet.",
    meaning: "This is a possible long continuation setup, but it still needs strength to improve.",
    action: "Good for traders who want early trend exposure with disciplined confirmation.",
    chartType: "early_up",
  },
  {
    id: "short-moderate-low",
    title: "Early bearish trend",
    tradeCall: "SHORT",
    strength: "Moderate",
    confidence: "Low",
    summary: "Bearish pressure is forming, but reliability is still limited.",
    meaning: "TradeRadar sees early downside conditions, but conviction is not fully established.",
    action: "Better as a monitored short candidate than an aggressive entry.",
    chartType: "early_down",
  },
];

function getTradeCallStyles(call: PlaybookCard["tradeCall"]) {
  if (call === "LONG") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (call === "SHORT") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (call === "DEFENSIVE") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
}

function getStrengthStyles(strength: PlaybookCard["strength"]) {
  if (strength === "Strong") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (strength === "Moderate") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
}

function getConfidenceStyles(confidence: PlaybookCard["confidence"]) {
  if (confidence === "High") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (confidence === "Medium") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }

  return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
}

function MiniChart({ type }: { type: PlaybookCard["chartType"] }) {
  const baseLine =
    "absolute left-0 right-0 top-1/2 h-px bg-zinc-800/80";

  if (type === "breakout_up") {
    return (
      <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(10,10,12,0.94)_0%,rgba(4,4,6,0.98)_100%)]">
        <div className={baseLine} />
        <svg viewBox="0 0 240 96" className="h-full w-full">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-emerald-400"
            points="10,70 40,68 70,69 100,67 130,65 150,64 165,58 180,44 200,28 230,16"
          />
        </svg>
      </div>
    );
  }

  if (type === "breakdown_down") {
    return (
      <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(10,10,12,0.94)_0%,rgba(4,4,6,0.98)_100%)]">
        <div className={baseLine} />
        <svg viewBox="0 0 240 96" className="h-full w-full">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-red-400"
            points="10,22 40,24 70,23 100,25 130,28 150,32 170,46 190,58 210,70 230,82"
          />
        </svg>
      </div>
    );
  }

  if (type === "range") {
    return (
      <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(10,10,12,0.94)_0%,rgba(4,4,6,0.98)_100%)]">
        <div className={baseLine} />
        <svg viewBox="0 0 240 96" className="h-full w-full">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-zinc-300"
            points="10,48 35,45 60,51 85,47 110,50 135,46 160,51 185,47 210,49 230,48"
          />
        </svg>
      </div>
    );
  }

  if (type === "early_up") {
    return (
      <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(10,10,12,0.94)_0%,rgba(4,4,6,0.98)_100%)]">
        <div className={baseLine} />
        <svg viewBox="0 0 240 96" className="h-full w-full">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-emerald-300"
            points="10,66 40,64 70,62 100,61 130,58 160,54 190,48 230,40"
          />
        </svg>
      </div>
    );
  }

  if (type === "early_down") {
    return (
      <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(10,10,12,0.94)_0%,rgba(4,4,6,0.98)_100%)]">
        <div className={baseLine} />
        <svg viewBox="0 0 240 96" className="h-full w-full">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-red-300"
            points="10,30 40,32 70,35 100,38 130,42 160,47 190,53 230,60"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(10,10,12,0.94)_0%,rgba(4,4,6,0.98)_100%)]">
      <div className={baseLine} />
      <svg viewBox="0 0 240 96" className="h-full w-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-amber-300"
          points="10,50 35,44 60,54 85,38 110,58 135,34 160,62 185,36 210,56 230,42"
        />
      </svg>
    </div>
  );
}

export default function PlaybookPage() {
  return (
    <main className="min-h-screen bg-transparent text-white">
      <Header />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-zinc-800/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(10,10,12,0.97)_48%,rgba(6,6,8,0.99)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-10">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                Trading Playbook
              </div>

              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                How to read TradeRadar without guessing.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                TradeRadar does not only say buy or sell. It combines direction,
                setup strength, and confidence to help traders understand what kind
                of opportunity is forming.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/live"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
                >
                  Open Live
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-[linear-gradient(180deg,rgba(24,24,26,0.92)_0%,rgba(10,10,12,0.98)_100%)] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                >
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_36px_rgba(0,0,0,0.35)]">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Quick meaning
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    LONG / SHORT
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    Direction. Is the move favoring upside or downside?
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    WEAK / MODERATE / STRONG
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    Setup quality. How convincing is the opportunity?
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    LOW / MEDIUM / HIGH
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    Confidence. How much alignment exists behind the setup?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(14,14,16,0.94)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_28px_rgba(0,0,0,0.3)] sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Visual examples
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Six common TradeRadar conditions
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                These are not promises. They are fast visual guides to help you interpret the board correctly.
              </p>
            </div>

            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
            >
              See them on Live →
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {playbookCards.map((card) => (
            <article
              key={card.id}
              className="overflow-hidden rounded-3xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(6,6,8,0.99)_100%)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_rgba(0,0,0,0.45)]"
            >
              <div className="border-b border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(10,10,12,0.98)_100%)] px-5 py-4 sm:px-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getTradeCallStyles(
                      card.tradeCall
                    )}`}
                  >
                    {card.tradeCall}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getStrengthStyles(
                      card.strength
                    )}`}
                  >
                    {card.strength}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getConfidenceStyles(
                      card.confidence
                    )}`}
                  >
                    {card.confidence}
                  </span>
                </div>

                <h3 className="text-lg font-semibold leading-tight text-white sm:text-xl">
                  {card.title}
                </h3>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <MiniChart type={card.chartType} />

                <section className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    What it means
                  </div>
                  <p className="text-sm leading-7 text-zinc-100">
                    {card.meaning}
                  </p>
                </section>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800/80 bg-black/30 p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Summary
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {card.summary}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-black/30 p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      How to use it
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {card.action}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[28px] border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(14,14,16,0.95)_0%,rgba(6,6,8,0.99)_100%)] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Final reminder
              </div>

              <h3 className="text-xl font-semibold tracking-tight text-white">
                TradeRadar helps you read the setup faster.
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400">
                Use Home for context, use Live for ranking, use the Playbook for interpretation.
                The best setups usually have alignment between direction, strength, and confidence.
              </p>
            </div>

            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
            >
              Open Live Opportunities
            </Link>
          </div>
        </div>
      </section>

      <FloatingTradeButton />
    </main>
  );
}