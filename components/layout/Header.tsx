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

const navItems = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Live" },
  { href: "/playbook", label: "Playbook" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="min-w-0 flex-1"
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

              <div className="min-w-0">
                <div className="truncate text-xl font-extrabold tracking-[-0.03em] text-white sm:text-2xl">
                  Trade<span className="text-emerald-400">Radar</span>
                </div>

                <div className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-500 md:block">
                  Macro Signals For Fast Execution
                </div>
              </div>
            </div>
          </Link>
        </div>

        <nav
          className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1"
          aria-label="Primary"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition sm:px-4 sm:text-xs ${getLinkStyles(
                  isActive
                )}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}