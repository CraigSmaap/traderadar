const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://traderadar.app";

type SignalRow = {
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  entry_zone_low: number;
  entry_zone_high: number;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
};

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 5 });
}

function buildSignalMessage(row: SignalRow): string {
  const dir = row.direction === "BUY" ? "🟢 BUY" : "🔴 SELL";
  const flag = row.direction === "BUY" ? "📈" : "📉";

  return [
    `${flag} *NEW SIGNAL — ${row.asset} ${dir}*`,
    ``,
    `📍 *Entry Zone:* ${formatPrice(row.entry_zone_low)} – ${formatPrice(row.entry_zone_high)}`,
    `🛑 *Stop Loss:* ${formatPrice(row.stop_loss)}`,
    `✅ *TP1:* ${formatPrice(row.tp1)}`,
    `✅ *TP2:* ${formatPrice(row.tp2)}`,
    `✅ *TP3:* ${formatPrice(row.tp3)}`,
    ``,
    `⚠️ Risk 1–2% max per trade`,
    `📊 [View full plan](${APP_URL}/live)`,
  ].join("\n");
}

export async function sendTelegramSignal(row: SignalRow): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const text = buildSignalMessage(row);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram send failed:", res.status, body);
    }
  } catch (err) {
    console.error("Telegram fetch error:", err);
  }
}

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("Telegram fetch error:", err);
  }
}
