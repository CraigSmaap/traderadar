"use client";

import { EXNESS_TRADING_URL } from "@/lib/broker";

export default function FloatingTradeButton() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 sm:hidden">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-emerald-500/20 bg-black/80 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <a
          href={EXNESS_TRADING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 text-black transition hover:brightness-105 active:scale-[0.99]"
        >
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/65">
              Quick Launch
            </div>
            <div className="mt-1 truncate text-base font-black uppercase tracking-[0.08em]">
              Trade on Exness
            </div>
          </div>
          <div className="shrink-0 text-sm font-black uppercase tracking-[0.12em]">
            Open →
          </div>
        </a>
      </div>
    </div>
  );
}
