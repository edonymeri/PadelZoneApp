
/**
 * Court-Weighted + capped margin + bonuses (per player, per round)
 * - Base: Win = +2, Loss = 0
 * - Court multipliers: C1 x1.5, C2 x1.25, C3+ x1.0  (applies to base only)
 * - Margin bonus: min(diff, 5)/2   → 0.5..2.5
 * - Bonuses: Defend C1 +1, Promotion +0.5
 * - Cap: min(6, max(0, total))
 */
export function courtMultiplier(court: number) {
  if (court === 1) return 1.5;
  if (court === 2) return 1.25;
  return 1.0;
}

export function roundPointsForPlayer(opts: {
  won: boolean;
  court: number;
  pointDiff: number;
  defendedC1: boolean;
  promoted: boolean;
}) {
  const base = opts.won ? 2 : 0;
  const mult = courtMultiplier(opts.court);
  const margin = Math.max(0, Math.min(opts.pointDiff, 5)) / 2;
  const defend = opts.defendedC1 ? 1 : 0;
  const promo = opts.promoted ? 0.5 : 0;
  const total = base * mult + (opts.won ? margin : 0) + defend + promo;
  return Math.max(0, Math.min(6, total));
}
