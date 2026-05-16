export type SignalResult = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  entry_zone_low?: number | null;
  entry_zone_high?: number | null;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  status: string;
  pnl_percent?: number | null;
  last_price?: number | null;
  result_label?: string | null;
  created_at: string;
};

export type JournalEntry = {
  id: string;
  user_id?: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  exit_price: number | null;
  lot_size: number | null;
  pnl_amount: number | null;
  pnl_percent: number | null;
  emotion: string | null;
  notes: string | null;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
};

export const ASSETS = [
  "XAUUSD", "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD",
  "USDJPY", "USDZAR", "NAS100", "SPX500", "XAGUSD",
  "USOIL", "UKOIL", "AUDUSD", "USDCAD", "USDCHF",
  "EURGBP", "EURJPY", "GBPJPY", "EURZAR", "GBPZAR",
  "XRPUSD", "SOLUSD", "DE40", "UK100",
];
