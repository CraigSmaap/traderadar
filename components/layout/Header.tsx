import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-2xl font-bold text-white">TradeRadar</h1>
          <p className="text-xs text-zinc-400">
            Global events → trade opportunities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-white transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            Feed
          </Link>

          <Link
            href="/admin"
            className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-yellow-400 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            Admin
          </Link>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-green-400">
            LIVE
          </div>
        </div>
      </div>
    </header>
  );
}