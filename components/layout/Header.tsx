"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveAccessTier, getTrialDaysRemaining } from "@/lib/access";

type NavItem = {
  href: string;
  label: string;
  premium?: boolean;
};

function getLinkStyles(isActive: boolean, premium?: boolean) {
  if (isActive && premium) {
    return "border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.08)]";
  }

  if (isActive) {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]";
  }

  if (premium) {
    return "border border-yellow-500/20 bg-yellow-500/5 text-yellow-300 hover:border-yellow-400/40 hover:bg-yellow-500/10";
  }

  return "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white";
}

const navItems: NavItem[] = [
  { href: "/live", label: "Live" },
  { href: "/stocks", label: "Stocks" },
  { href: "/performance", label: "Performance" },
  { href: "/backtest", label: "Backtest", premium: true },
  { href: "/journal", label: "Journal" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState<string | null>(null);
  const [tierLabel, setTierLabel] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);

      if (!user) {
        setTierLabel(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,created_at")
        .eq("id", user.id)
        .single();

      const tier = resolveAccessTier(profile?.role, profile?.created_at);

      if (tier === "trial" && profile?.created_at) {
        const days = getTrialDaysRemaining(profile.created_at, profile.role);
        setTierLabel(`Trial · ${days}d left`);
      } else {
        setTierLabel(tier.toUpperCase());
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);

      if (!session?.user) {
        setTierLabel(null);
      } else {
        loadUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setEmail(null);
    setTierLabel(null);
    router.push("/login");
    router.refresh();
  }

  const fullNavItems =
    tierLabel === "ADMIN"
      ? [...navItems, { href: "/admin", label: "Admin" }]
      : navItems;

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
                  Beginner Trading Decision Engine
                </div>
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {email ? (
              <>
                {tierLabel ? (
                  <span
                    className={`hidden rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] md:block ${
                      tierLabel.startsWith("Trial")
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                        : tierLabel === "EXPIRED"
                          ? "border-red-500/20 bg-red-500/10 text-red-300"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {tierLabel}
                  </span>
                ) : null}

                <span className="hidden max-w-[180px] truncate rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400 sm:block">
                  {email}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-500/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-500/20"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <nav
          className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1"
          aria-label="Primary"
        >
          {fullNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${getLinkStyles(
                  isActive,
                  item.premium
                )}`}
              >
                {item.label}
                {item.premium ? (
                  <span className="ml-2 rounded-full bg-yellow-400/20 px-2 py-0.5 text-[9px] text-yellow-200">
                    PROOF
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}