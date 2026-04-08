"use client";

type TradeThisButtonProps = {
  href: string;
  asset?: string;
};

export default function TradeThisButton({
  href,
  asset,
}: TradeThisButtonProps) {
  const handleClick = () => {
    if (typeof window === "undefined") return;

    const clickData = {
      asset: asset || "Unknown",
      link: href,
      time: new Date().toISOString(),
    };

    const existing = window.localStorage.getItem("tradeClicks");
    const clicks = existing ? JSON.parse(existing) : [];

    clicks.push(clickData);

    window.localStorage.setItem("tradeClicks", JSON.stringify(clicks));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-emerald-400 active:scale-[0.99]"
    >
      Trade This Signal
    </a>
  );
}