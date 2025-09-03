
/**
 * Simplified scoring system for better player understanding
 * - Base: Win = +3, Loss = 0
 * - Margin bonus: +1 for winning by 10+ points
 * - Defend C1 bonus: +1 for winning on Court 1
 * - Cap: min(5, max(0, total))
 */
export function roundPointsForPlayer(opts: {
  won: boolean;
  court: number;
  pointDiff: number;
  defendedC1: boolean;
  promoted: boolean;
}) {
  const base = opts.won ? 3 : 0;                    // Win = 3, Loss = 0
  const margin = opts.won && opts.pointDiff >= 10 ? 1 : 0;  // +1 for 10+ point wins
  const defend = opts.defendedC1 ? 1 : 0;          // Keep defend C1 bonus
  const total = base + margin + defend;
  return Math.max(0, Math.min(5, total));          // Cap at 5 points
}

/**
 * Determine event winners based on different criteria
 */
export function determineEventWinners(playerStats: any[]) {
  return {
    champion: playerStats.sort((a, b) => b.total_points - a.total_points)[0],
    mostGamesWon: playerStats.sort((a, b) => b.games_won - a.games_won)[0],
    bestWinRate: playerStats.filter(p => p.games_played >= 3)
                           .sort((a, b) => b.win_rate - a.win_rate)[0]
  };
}
