
import { getFormatSpecificEloConfig } from './clubSettings';
import type { EloConfig } from './clubSettings';

export function expectedScore(ra: number, rb: number) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

/**
 * Format-aware ELO calculation for team vs team matches
 * Uses format-specific K-factors and constraints
 */
export function updateEloTeamVsTeam(
  teamAEloAvg: number,
  teamBEloAvg: number,
  aWon: boolean,
  eloConfig?: EloConfig,
  format?: 'winners-court' | 'americano',
  variant?: 'individual' | 'team'
) {
  // Get format-specific configuration
  let K = 16; // default
  let maxGain = 50;
  let maxLoss = 50;
  
  if (eloConfig && format) {
    const formatConfig = getFormatSpecificEloConfig(eloConfig, format, variant);
    K = formatConfig.kFactor;
    maxGain = formatConfig.maxEloGainPerMatch;
    maxLoss = formatConfig.maxEloLossPerMatch;
  } else if (eloConfig) {
    // Legacy: use direct config properties
    K = eloConfig.kFactor;
  }

  const Ea = expectedScore(teamAEloAvg, teamBEloAvg);
  const Sa = aWon ? 1 : 0;
  let deltaA = Math.round(K * (Sa - Ea));
  
  // Apply format-specific constraints
  deltaA = Math.max(-maxLoss, Math.min(maxGain, deltaA));
  
  return deltaA; // apply +deltaA to both A players, -deltaA to both B players
}

/**
 * Format-aware individual ELO update (for Americano individual mode)
 */
export function updateIndividualElo(
  playerElo: number,
  opponentAvgElo: number,
  won: boolean,
  eloConfig?: EloConfig,
  format?: 'winners-court' | 'americano'
) {
  let K = 16; // default
  let maxGain = 30;
  let maxLoss = 30;
  
  if (eloConfig && format) {
    const formatConfig = getFormatSpecificEloConfig(eloConfig, format, 'individual');
    K = formatConfig.kFactor;
    maxGain = formatConfig.maxEloGainPerMatch;
    maxLoss = formatConfig.maxEloLossPerMatch;
  }

  const Ea = expectedScore(playerElo, opponentAvgElo);
  const Sa = won ? 1 : 0;
  let delta = Math.round(K * (Sa - Ea));
  
  // Apply constraints
  delta = Math.max(-maxLoss, Math.min(maxGain, delta));
  
  return delta;
}
