import type {
  CourtMatch,
  RoundState,
  UUID,
  EngineOptions,
  EventFormat,
} from './types';

// Import both engines
import { nextRound as nextRoundWinnersCourt } from './engine';
import { nextRoundAmericano } from './americano-engine';

/**
 * Engine Dispatcher
 * 
 * This module routes round advancement requests to the appropriate engine
 * based on the tournament format. Winner's Court uses dynamic calculation,
 * while Americano uses deterministic calculation.
 */

/**
 * Get the next round state based on tournament format
 * @param format Tournament format ("winners-court" or "americano")
 * @param current Current round state
 * @param options Engine options
 * @param previousRounds Previous rounds history
 * @param playerPositionMap Player position mapping (for Americano only)
 * @returns Next round state
 */
export function getNextRound(
  format: EventFormat,
  current: RoundState,
  options: EngineOptions,
  previousRounds: RoundState[],
  playerPositionMap?: Record<UUID, number>
): RoundState {
  switch (format) {
    case "winners-court":
      return nextRoundWinnersCourt(current, options, previousRounds);
    
    case "americano":
      return nextRoundAmericano(current, options, previousRounds, playerPositionMap);
    
    default:
      throw new Error(`Unsupported tournament format: ${format}`);
  }
}

/**
 * Validate that the current round state is compatible with the format
 * @param format Tournament format
 * @param current Current round state
 * @returns True if valid, throws error if invalid
 */
export function validateRoundState(format: EventFormat, current: RoundState): boolean {
  const numCourts = current.courts.length;
  const allPlayers = getAllPlayersFromRound(current);
  const requiredPlayers = numCourts * 4;
  
  if (allPlayers.length !== requiredPlayers) {
    throw new Error(`Invalid round state: expected ${requiredPlayers} players, got ${allPlayers.length}`);
  }
  
  switch (format) {
    case "winners-court":
      // Winner's Court validation (existing logic)
      return true;
    
    case "americano":
      // Americano validation
      if (numCourts < 1) {
        throw new Error("Americano requires at least 1 court");
      }
      if (allPlayers.length < 4) {
        throw new Error("Americano requires at least 4 players");
      }
      return true;
    
    default:
      throw new Error(`Unsupported tournament format: ${format}`);
  }
}

/**
 * Get engine-specific options for the given format
 * @param format Tournament format
 * @param baseOptions Base options
 * @returns Format-specific options
 */
export function getEngineOptions(format: EventFormat, baseOptions: EngineOptions): EngineOptions {
  switch (format) {
    case "winners-court":
      return {
        antiRepeatWindow: baseOptions.antiRepeatWindow ?? 3
      };
    
    case "americano":
      return {
        antiRepeatWindow: baseOptions.antiRepeatWindow ?? 3
      };
    
    default:
      return baseOptions;
  }
}

/**
 * Check if a format supports wildcard rounds
 * @param format Tournament format
 * @returns True if wildcards are supported
 */
export function supportsWildcards(format: EventFormat): boolean {
  switch (format) {
    case "winners-court":
      return true;
    
    case "americano":
      return false; // Americano doesn't use wildcards
    
    default:
      return false;
  }
}

/**
 * Get format-specific description
 * @param format Tournament format
 * @returns Human-readable description
 */
export function getFormatDescription(format: EventFormat): string {
  switch (format) {
    case "winners-court":
      return "Winner's Court: Players move up and down courts based on performance. Court 1 is the prestigious Winners Court.";
    
    case "americano":
      return "Americano: Players rotate partners each round. Each player earns individual points based on their team's score.";
    
    default:
      return "Unknown format";
  }
}

/**
 * Helper function to extract all players from a round
 */
function getAllPlayersFromRound(round: RoundState): UUID[] {
  const players = new Set<UUID>();
  
  for (const court of round.courts) {
    players.add(court.teamA[0]);
    players.add(court.teamA[1]);
    players.add(court.teamB[0]);
    players.add(court.teamB[1]);
  }
  
  return Array.from(players);
}
