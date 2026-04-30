import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Direction = "BUY" | "SELL";
type TradeStatus = "open" | "closed";

function isDirection(value: unknown): value is Direction {
  return value === "BUY" || value === "SELL";
}

function isStatus(value: unknown): value is TradeStatus {
  return value === "open" || value === "closed";
}

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return null;

  return numberValue;
}

function calculatePnl(
  direction: Direction,
  entryPrice: number,
  exitPrice: number,
  lotSize: number
) {
  const difference =
    direction === "BUY" ? exitPrice - entryPrice : entryPrice - exitPrice;

  return difference * lotSize * 100;
}

function calculatePnlPercent(pnlAmount: number, entryPrice: number) {
  if (entryPrice === 0) return null;
  return (pnlAmount / entryPrice) * 100;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("trade_journal")
    .select("*")
    .eq("user_id", user.id)
    .order("opened_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  const asset = String(body.asset || "").trim().toUpperCase();
  const direction = body.direction;
  const entryPrice = toNumberOrNull(body.entry_price);
  const exitPrice = toNumberOrNull(body.exit_price);
  const lotSize = toNumberOrNull(body.lot_size);
  const emotion = body.emotion ? String(body.emotion).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;
  const sourceSignalId = body.source_signal_id
    ? String(body.source_signal_id).trim()
    : null;
  const status = body.status || "open";

  if (!asset) {
    return NextResponse.json({ error: "Asset is required" }, { status: 400 });
  }

  if (!isDirection(direction)) {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  if (entryPrice === null) {
    return NextResponse.json(
      { error: "Entry price is required" },
      { status: 400 }
    );
  }

  if (!isStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let pnlAmount: number | null = null;
  let pnlPercent: number | null = null;

  if (exitPrice !== null && lotSize !== null) {
    pnlAmount = calculatePnl(direction, entryPrice, exitPrice, lotSize);
    pnlPercent = calculatePnlPercent(pnlAmount, entryPrice);
  }

  const finalStatus = exitPrice !== null && lotSize !== null ? "closed" : "open";

  const { data, error } = await supabase
    .from("trade_journal")
    .insert({
      user_id: user.id,
      asset,
      direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      lot_size: lotSize,
      pnl_amount: pnlAmount,
      pnl_percent: pnlPercent,
      emotion,
      notes,
      source_signal_id: sourceSignalId,
      status: finalStatus,
      closed_at: finalStatus === "closed" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}