// Round-trip spread estimates as % of price (entry spread + exit spread combined).
// Source: Exness Standard account typical conditions.
const ASSET_SPREADS_PCT: Record<string, number> = {
  // Major forex
  EURUSD: 0.020, // ~2 pips at 1.08
  GBPUSD: 0.022, // ~2.8 pips at 1.27
  USDJPY: 0.016, // ~2.4 pips at 150
  AUDUSD: 0.022,
  USDCAD: 0.022,
  USDCHF: 0.022,
  EURGBP: 0.030,
  EURJPY: 0.024,
  GBPJPY: 0.040, // wider cross
  // ZAR pairs (wider market)
  USDZAR: 0.055,
  EURZAR: 0.100,
  GBPZAR: 0.120,
  // Commodities
  XAUUSD: 0.025, // ~$0.60 at $2400
  XAGUSD: 0.150, // ~$0.045 at $30
  USOIL:  0.125, // ~$0.10 at $80
  UKOIL:  0.150,
  // Indices (very liquid, tight spreads)
  NAS100: 0.009, // ~1.6 pts at 18000
  SPX500: 0.012, // ~0.6 pts at 5000
  DE40:   0.010,
  UK100:  0.022,
  // Crypto
  BTCUSD: 0.050, // ~$40 at $80000
  ETHUSD: 0.080, // ~$2 at $2500
  XRPUSD: 0.300, // wide — smaller crypto
  SOLUSD: 0.140,
};

const DEFAULT_SPREAD_PCT = 0.040;

/** Round-trip spread as % of price (entry + exit). */
export function getAssetSpreadPct(asset?: string | null): number {
  const normalized = (asset || "")
    .toUpperCase()
    .replace(/[\s\-\/]/g, "")
    .trim();
  return ASSET_SPREADS_PCT[normalized] ?? DEFAULT_SPREAD_PCT;
}

/**
 * Round-trip spread cost in R-multiples.
 * = (spreadPct% / 100) × entry / riskDistance
 */
export function getSpreadCostR(
  asset: string | undefined | null,
  entry: number,
  riskDistance: number
): number {
  if (entry === 0 || riskDistance === 0) return 0;
  const pct = getAssetSpreadPct(asset);
  return ((pct / 100) * entry) / riskDistance;
}
