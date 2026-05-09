import { NextResponse } from "next/server";
import { sendTelegramSignal, sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set" },
      { status: 500 }
    );
  }

  // Send a test message first
  await sendTelegramMessage("✅ *TradeRadar bot is connected.* Test signal below:");

  // Then send a realistic sample signal
  await sendTelegramSignal({
    asset: "XAUUSD",
    direction: "BUY",
    entry_price: 2347.5,
    entry_zone_low: 2340,
    entry_zone_high: 2355,
    stop_loss: 2318,
    tp1: 2390,
    tp2: 2415,
    tp3: 2440,
  });

  return NextResponse.json({ ok: true, message: "Test signal sent to Telegram" });
}
