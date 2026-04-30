"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-900 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Trade<span className="text-emerald-400">Radar</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500 max-w-sm">
              Market signals and trade setups for fast execution. Not financial advice.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-zinc-400">
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/risk-disclaimer" className="hover:text-white">
              Risk
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-900 pt-4 text-xs text-zinc-600">
          © {new Date().getFullYear()} TradeRadar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}