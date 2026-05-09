export type AccessTier = "trial" | "pro" | "admin" | "expired";

export const TRIAL_DAYS = 7;

// Returns how many full days remain in the trial (0 once expired)
export function getTrialDaysRemaining(createdAt: string): number {
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
}

// Primary resolver — always use this when you have the profile's created_at
export function resolveAccessTier(
  role?: string | null,
  createdAt?: string | null,
): AccessTier {
  if (role === "admin") return "admin";
  if (role === "pro") return "pro";
  if (!createdAt) return "trial"; // safe default: new users start in trial
  return getTrialDaysRemaining(createdAt) > 0 ? "trial" : "expired";
}

// Legacy shim for callers that don't have created_at yet
export function normalizeAccessTier(role?: string | null): AccessTier {
  if (role === "pro") return "pro";
  if (role === "admin") return "admin";
  return "trial"; // without a date we can't know — optimistic default
}

export function getVisibleSignalLimit(tier: AccessTier): number {
  return tier === "expired" ? 0 : 10;
}

export function canViewFullTradePlan(tier: AccessTier): boolean {
  return tier !== "expired";
}

export function canUseLotCalculator(tier: AccessTier): boolean {
  return tier !== "expired";
}

export function canUseBrokerActions(tier: AccessTier): boolean {
  return tier !== "expired";
}
