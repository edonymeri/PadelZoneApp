
import { getFormatSpecificScoringConfig } from './clubSettings';
import type { ScoringConfig } from './clubSettings';

/**
 * Format-aware configurable scoring system using club-specific settings
 * - Base: Win = configured points, Loss = 0
 * - Margin bonus: configurable threshold and points
 * - Defend C1 bonus: configurable points and start round (format-specific)
 * - Cap: configurable maximum points
 */
export function roundPointsForPlayer(opts: {
  won: boolean;
  court: number;
  pointDiff: number;
  defendedC1: boolean;
  promoted: boolean;
}, scoringConfig?: ScoringConfig, format?: 'winners-court' | 'americano') {
  // Use default values if no config provided (backward compatibility)
  const defaultConfig = {
    baseWinPoints: 3,
    marginBonusThreshold: 10,
    marginBonusPoints: 1,
    maxPointsPerMatch: 5,
    winnersCourtBonusPoints: 1,
  };

  // Get format-specific configuration if available
  let config;
  if (scoringConfig && format) {
    const formatConfig = getFormatSpecificScoringConfig(scoringConfig, format);
    config = formatConfig;
  } else if (scoringConfig) {
    // Legacy: use direct config properties
    config = {
      baseWinPoints: scoringConfig.baseWinPoints,
      marginBonusThreshold: scoringConfig.marginBonusThreshold,
      marginBonusPoints: scoringConfig.marginBonusPoints,
      maxPointsPerMatch: scoringConfig.maxPointsPerMatch,
      winnersCourtBonusPoints: scoringConfig.winnersCourtBonusPoints,
    };
  } else {
    config = defaultConfig;
  }

  const base = opts.won ? config.baseWinPoints : 0;
  const margin = opts.won && opts.pointDiff >= config.marginBonusThreshold ? config.marginBonusPoints : 0;
  const defend = opts.defendedC1 ? config.winnersCourtBonusPoints : 0;
  const total = base + margin + defend;
  return Math.max(0, Math.min(config.maxPointsPerMatch, total));
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
