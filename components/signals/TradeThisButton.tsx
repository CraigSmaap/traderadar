"use client";

type TradeThisButtonProps = {
  href: string;
  asset?: string;
};

export default function TradeThisButton({ href, asset }: TradeThisButtonProps) {
  const handleClick = () => {
    const clickData = {
      asset,
      link: href,
      time: new Date().toISOString(),
    };

    const existing = localStorage.getItem("tradeClicks");
    const clicks = existing ? JSON.parse(existing) : [];

    clicks.push(clickData);

    localStorage.setItem("tradeClicks", JSON.stringify(clicks));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex w-full items-center justify-center rounded-xl bg-green-500 px-4 py-4 text-base font-bold text-black transition hover:bg-green-600 active:scale-[0.97] sm:py-3 sm:text-sm"
    >
      TRADE THIS →
    </a>
  );
}