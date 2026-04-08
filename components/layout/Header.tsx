"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function getLinkStyles(isActive: boolean) {
  if (isActive) {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]";
  }

  return "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white";
}

export default function Header() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isLive = pathname === "/live";
  const isPlaybook = pathname === "/playbook";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="min-w-0 shrink"
          aria-label="TradeRadar home"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/traderadar-mark.svg"
              alt="TradeRadar"
              width={128}
              height={128}
              priority
              className="h-10 w-10 shrink-0 sm:h-11 sm:w-11"
            />

            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-lg font-extrabold tracking-[-0.03em] text-white sm:text-xl">
                Trade<span className="text-emerald-400">Radar</span>
              </span>

              <span className="mt-1 hidden whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.32em] text-zinc-500 md:block">
                Macro Signals For Fast Execution
              </span>
            </div>
          </div>
        </Link>

        <nav className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition sm:px-4 sm:text-xs ${getLinkStyles(
              isHome
            )}`}
          >
            Home
          </Link>

          <Link
            href="/live"
            className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition sm:px-4 sm:text-xs ${getLinkStyles(
              isLive
            )}`}
          >
            Live
          </Link>

          <Link
            href="/playbook"
            className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition sm:px-4 sm:text-xs ${getLinkStyles(
              isPlaybook
            )}`}
          >
            Playbook
          </Link>
        </nav>
      </div>
    </header>
  );
}