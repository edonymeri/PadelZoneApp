import type {
  CourtMatch,
  RoundState,
  UUID,
  EngineOptions,
} from './types';

/**
 * Americano Tournament Engine - Hardcoded System
 * 
 * This engine uses mathematically correct hardcoded rounds for 8 players.
 * Each player gets a random position (1-8) that stays fixed for the entire event.
 * All rounds are pre-calculated and stored in the database.
 */

/**
 * Hardcoded round patterns for 8 players (7 rounds total)
 * Each round ensures no player plays with the same partner twice
 */
const AMERICANO_8_PLAYER_ROUNDS = [
  // Round 1: 1-2 vs 3-4, 5-6 vs 7-8
  [
    { teamA: [1, 2], teamB: [3, 4] },
    { teamA: [5, 6], teamB: [7, 8] }
  ],
  // Round 2: 1-3 vs 2-5, 4-6 vs 7-8
  [
    { teamA: [1, 3], teamB: [2, 5] },
    { teamA: [4, 6], teamB: [7, 8] }
  ],
  // Round 3: 1-4 vs 2-6, 3-5 vs 7-8
  [
    { teamA: [1, 4], teamB: [2, 6] },
    { teamA: [3, 5], teamB: [7, 8] }
  ],
  // Round 4: 1-5 vs 2-7, 3-6 vs 4-8
  [
    { teamA: [1, 5], teamB: [2, 7] },
    { teamA: [3, 6], teamB: [4, 8] }
  ],
  // Round 5: 1-6 vs 2-8, 3-7 vs 4-5
  [
    { teamA: [1, 6], teamB: [2, 8] },
    { teamA: [3, 7], teamB: [4, 5] }
  ],
  // Round 6: 1-7 vs 2-4, 3-8 vs 5-6
  [
    { teamA: [1, 7], teamB: [2, 4] },
    { teamA: [3, 8], teamB: [5, 6] }
  ],
  // Round 7: 1-8 vs 2-3, 4-7 vs 5-6
  [
    { teamA: [1, 8], teamB: [2, 3] },
    { teamA: [4, 7], teamB: [5, 6] }
  ]
];

/**
 * Generate all Americano rounds for an event
 * @param playerPositionMap Map of player IDs to positions (1-8)
 * @param numCourts Number of courts (should be 2 for 8 players)
 * @returns Array of all rounds for the tournament
 */
export function generateAmericanoTournament(
  playerPositionMap: Record<UUID, number>,
  numCourts: number
): RoundState[] {
  if (numCourts !== 2) {
    throw new Error('Americano currently only supports 2 courts (8 players)');
  }

  // Convert position map to player array
  const playersByPosition = Object.entries(playerPositionMap)
    .sort(([, posA], [, posB]) => posA - posB)
    .map(([playerId]) => playerId);

  if (playersByPosition.length !== 8) {
    throw new Error('Americano requires exactly 8 players');
  }

  console.log(`🎾 Generating Americano tournament with players:`, playersByPosition);
  console.log(`🎾 Position mapping:`, playerPositionMap);

  // Generate all rounds using hardcoded patterns
  const rounds: RoundState[] = [];
  
  for (let roundNum = 1; roundNum <= AMERICANO_8_PLAYER_ROUNDS.length; roundNum++) {
    const roundPattern = AMERICANO_8_PLAYER_ROUNDS[roundNum - 1];
    const courts: CourtMatch[] = [];

    roundPattern.forEach((match, courtIndex) => {
      const courtNum = courtIndex + 1;
      const teamA = match.teamA.map(pos => playersByPosition[pos - 1]);
      const teamB = match.teamB.map(pos => playersByPosition[pos - 1]);

      courts.push({
        court_num: courtNum,
        teamA: teamA as [UUID, UUID],
        teamB: teamB as [UUID, UUID],
        scoreA: undefined,
        scoreB: undefined,
      });
    });

    rounds.push({
      roundNum,
      courts,
    });

    console.log(`🎾 Round ${roundNum}:`, courts);
  }

  return rounds;
}

/**
 * Get a specific round from the tournament
 * @param roundNumber Round number (1-7)
 * @param allRounds All rounds for the tournament
 * @returns The specific round state
 */
export function getAmericanoRound(roundNumber: number, allRounds: RoundState[]): RoundState | null {
  return allRounds.find(round => round.roundNum === roundNumber) || null;
}

/**
 * Check if all rounds are complete
 * @param allRounds All rounds for the tournament
 * @returns True if all rounds are finished
 */
export function isAmericanoTournamentComplete(allRounds: RoundState[]): boolean {
  return allRounds.every(round => 
    round.courts.every(court => 
      court.scoreA !== undefined && court.scoreB !== undefined
    )
  );
}

/**
 * Legacy function for compatibility - not used in new system
 */
export function nextRoundAmericano(
  current: RoundState,
  options: EngineOptions,
  previousRounds: RoundState[],
  playerPositionMap?: Record<UUID, number>
): RoundState {
  throw new Error('nextRoundAmericano is deprecated. Use pre-generated rounds instead.');
}