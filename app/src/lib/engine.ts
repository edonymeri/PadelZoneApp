
import type { 
  CourtMatch, 
  RoundState, 
  UUID, 
  EngineOptions, 
  EventFormat, 
  AmericanoVariant, 
  AmericanoPartnerHistory, 
  AmericanoPairingOptions 
} from './types';

// Re-export types for external use
export type { AmericanoPairingOptions } from './types';

/**
 * Given the current round state with scores filled in,
 * returns the next round's pairings using Winners Court mapping.
 * Also provides a simple anti-repeat partners swap (last 3 rounds).
 */

function winnerLoser(ct: CourtMatch): { winners: UUID[]; losers: UUID[] } {
  const aWin = (ct.scoreA ?? 0) > (ct.scoreB ?? 0);
  const bWin = (ct.scoreB ?? 0) > (ct.scoreA ?? 0);
  // treat tie as Team A win by 1 for determinism
  const winners = aWin || (!aWin && !bWin) ? ct.teamA : ct.teamB;
  const losers = aWin || (!aWin && !bWin) ? ct.teamB : ct.teamA;
  return { winners, losers };
}

// Removed unused splitCross helper (previous pairing logic refactored)

export function nextRound(
  current: RoundState,
  options: EngineOptions,
  previousRounds: RoundState[] // include last N rounds for anti-repeat
): RoundState {
  const W: Record<number, UUID[]> = {};
  const L: Record<number, UUID[]> = {};

  for (const ct of current.courts) {
    const { winners, losers } = winnerLoser(ct);
    W[ct.court_num] = winners;
    L[ct.court_num] = losers;
  }

  const cN = current.courts.length;
  const nextCourts: CourtMatch[] = [];

  for (let c = 1; c <= cN; c++) {
    // Generic Winners-Court mapping:
    //  c === 1         → W1 + W2
    //  c === cN (last) → L(c-1) + Lc
    //  otherwise       → L(c-1) + W(c+1)
    let arrivals: UUID[] = [];
    if (c === 1) {
      arrivals = [...(W[1] || []), ...(W[2] || [])];
    } else if (c === cN) {
      arrivals = [...(L[c - 1] || []), ...(L[c] || [])];
    } else {
      arrivals = [...(L[c - 1] || []), ...(W[c + 1] || [])];
    }

    // Safety guard: we must have exactly 4 players arriving to this court
    if (arrivals.length !== 4) {
      throw new Error(`Court ${c} expected 4 arrivals, got ${arrivals.length}`);
    }

    // Split & cross-pair [a,c] vs [b,d]
  const [a, b, cId, d] = arrivals;
  const teamA: UUID[] = [a, cId];
  const teamB: UUID[] = [b, d];

    // Anti-repeat partners (same logic as before)
    const k = options.antiRepeatWindow ?? 3;
    const recentPairs = new Set<string>();
    for (let i = Math.max(0, previousRounds.length - k); i < previousRounds.length; i++) {
      const r = previousRounds[i];
      for (const m of r.courts) {
        for (const pair of [[m.teamA[0], m.teamA[1]], [m.teamB[0], m.teamB[1]]]) {
          recentPairs.add(pair.slice().sort().join("-"));
        }
      }
    }
    const keyAC = [teamA[0], teamA[1]].slice().sort().join("-");
    const keyBD = [teamB[0], teamB[1]].slice().sort().join("-");
    if (recentPairs.has(keyAC) || recentPairs.has(keyBD)) {
      [teamA[1], teamB[1]] = [teamB[1], teamA[1]]; // swap the second arrivals
    }

    nextCourts.push({
      court_num: c,
      teamA: teamA as [UUID, UUID],
      teamB: teamB as [UUID, UUID],
      scoreA: undefined,
      scoreB: undefined,
    });
  }


  return { roundNum: current.roundNum + 1, courts: nextCourts };
}

/**
 * Americano pairing algorithms
 */

function buildPartnerHistory(previousRounds: RoundState[], players: UUID[]): Map<UUID, AmericanoPartnerHistory> {
  const history = new Map<UUID, AmericanoPartnerHistory>();
  
  // Initialize history for all players
  for (const playerId of players) {
    history.set(playerId, {
      playerId,
      partners: new Set<UUID>(),
      opponents: new Set<UUID>(),
      restCount: 0,
      gamesPlayed: 0
    });
  }

  // Build history from previous rounds
  for (const round of previousRounds) {
    const playingPlayers = new Set<UUID>();
    
    for (const court of round.courts) {
      const [a1, a2] = court.teamA;
      const [b1, b2] = court.teamB;
      
      // Track playing players
      [a1, a2, b1, b2].forEach(p => playingPlayers.add(p));
      
      // Record partners
      history.get(a1)?.partners.add(a2);
      history.get(a2)?.partners.add(a1);
      history.get(b1)?.partners.add(b2);
      history.get(b2)?.partners.add(b1);
      
      // Record opponents
      [a1, a2].forEach(p1 => {
        [b1, b2].forEach(p2 => {
          history.get(p1)?.opponents.add(p2);
          history.get(p2)?.opponents.add(p1);
        });
      });
      
      // Increment games played
      [a1, a2, b1, b2].forEach(p => {
        const h = history.get(p);
        if (h) h.gamesPlayed++;
      });
    }
    
    // Count rests for players who didn't play
    for (const playerId of players) {
      if (!playingPlayers.has(playerId)) {
        const h = history.get(playerId);
        if (h) h.restCount++;
      }
    }
  }
  
  return history;
}

function selectPlayersForRound(players: UUID[], courts: number, history: Map<UUID, AmericanoPartnerHistory>): {
  playing: UUID[];
  resting: UUID[];
} {
  const maxPlaying = courts * 4;
  
  if (players.length <= maxPlaying) {
    return { playing: players, resting: [] };
  }
  
  // Sort by rest count (ascending) and games played (ascending) for fairness
  const sortedPlayers = [...players].sort((a, b) => {
    const hA = history.get(a)!;
    const hB = history.get(b)!;
    
    // First priority: fewest rests
    if (hA.restCount !== hB.restCount) {
      return hA.restCount - hB.restCount;
    }
    
    // Second priority: fewest games played
    return hA.gamesPlayed - hB.gamesPlayed;
  });
  
  return {
    playing: sortedPlayers.slice(0, maxPlaying),
    resting: sortedPlayers.slice(maxPlaying)
  };
}

function generateAmericanoIndividualPairings(
  playingPlayers: UUID[], 
  courts: number,
  history: Map<UUID, AmericanoPartnerHistory>
): CourtMatch[] {
  if (playingPlayers.length !== courts * 4) {
    throw new Error(`Expected ${courts * 4} players, got ${playingPlayers.length}`);
  }
  
  const courtMatches: CourtMatch[] = [];
  const usedPlayers = new Set<UUID>();
  
  // Sort players by ELO descending for initial seeding, then apply rotation logic
  const playersByElo = [...playingPlayers].sort((a, b) => {
    // For now, assume random ELO ordering. In practice, you'd fetch ELO from player data
    return Math.random() - 0.5;
  });
  
  // Create blocks of 4 players for each court
  for (let courtNum = 1; courtNum <= courts; courtNum++) {
    const blockStart = (courtNum - 1) * 4;
    const block = playersByElo.slice(blockStart, blockStart + 4);
    
    if (block.length < 4) {
      throw new Error(`Court ${courtNum} doesn't have 4 players in block`);
    }
    
    // Initial pairing: [0,3] vs [1,2] (like social golfers)
    let [p1, p2, p3, p4] = block;
    let teamA: [UUID, UUID] = [p1, p4];
    let teamB: [UUID, UUID] = [p2, p3];
    
    // Check for partner repeats and swap if needed
    const h1 = history.get(p1)!;
    const h2 = history.get(p2)!;
    
    if (h1.partners.has(p4) || h2.partners.has(p3)) {
      // Swap to minimize repeats: [0,2] vs [1,3]
      teamA = [p1, p3];
      teamB = [p2, p4];
    }
    
    courtMatches.push({
      court_num: courtNum,
      teamA,
      teamB,
      scoreA: undefined,
      scoreB: undefined
    });
    
    // Mark players as used
    [teamA[0], teamA[1], teamB[0], teamB[1]].forEach(p => usedPlayers.add(p));
  }
  
  // Verify all players are used
  if (usedPlayers.size !== playingPlayers.length) {
    throw new Error(`Not all players were assigned. Used: ${usedPlayers.size}, Expected: ${playingPlayers.length}`);
  }
  
  return courtMatches;
}

function generateAmericanoTeamPairings(
  teams: Array<{ player1: UUID; player2: UUID }>,
  courts: number,
  previousTeamMatches: Array<{ team1: number; team2: number; round: number }>
): CourtMatch[] {
  if (teams.length < 2) {
    throw new Error("Need at least 2 teams for Team Americano");
  }
  
  const courtMatches: CourtMatch[] = [];
  const usedTeams = new Set<number>();
  
  // Sort teams by total score (Swiss-style) - for now use random
  const teamsWithIndex = teams.map((team, index) => ({ ...team, index }));
  teamsWithIndex.sort(() => Math.random() - 0.5);
  
  // Create matches avoiding repeats
  const matchedPairs = new Set<string>();
  
  for (let courtNum = 1; courtNum <= courts && usedTeams.size < teams.length - 1; courtNum++) {
    let team1Index = -1;
    let team2Index = -1;
    
    // Find a pair that hasn't played before
    for (const t1 of teamsWithIndex) {
      if (usedTeams.has(t1.index)) continue;
      
      for (const t2 of teamsWithIndex) {
        if (usedTeams.has(t2.index) || t1.index === t2.index) continue;
        
        const pairKey = [t1.index, t2.index].sort().join('-');
        const hasPlayed = previousTeamMatches.some(match => {
          const matchKey = [match.team1, match.team2].sort().join('-');
          return matchKey === pairKey;
        });
        
        if (!hasPlayed) {
          team1Index = t1.index;
          team2Index = t2.index;
          break;
        }
      }
      
      if (team1Index !== -1) break;
    }
    
    // If no fresh pairing found, take the first available pair
    if (team1Index === -1) {
      const availableTeams = teamsWithIndex.filter(t => !usedTeams.has(t.index));
      if (availableTeams.length >= 2) {
        team1Index = availableTeams[0].index;
        team2Index = availableTeams[1].index;
      }
    }
    
    if (team1Index !== -1 && team2Index !== -1) {
      const team1 = teams[team1Index];
      const team2 = teams[team2Index];
      
      courtMatches.push({
        court_num: courtNum,
        teamA: [team1.player1, team1.player2],
        teamB: [team2.player1, team2.player2],
        scoreA: undefined,
        scoreB: undefined
      });
      
      usedTeams.add(team1Index);
      usedTeams.add(team2Index);
    }
  }
  
  return courtMatches;
}

export function nextAmericanoRound(
  currentRound: number,
  courts: number,
  players: UUID[],
  previousRounds: RoundState[],
  options: AmericanoPairingOptions,
  teams?: Array<{ player1: UUID; player2: UUID }>
): RoundState {
  if (options.format !== 'americano') {
    throw new Error('nextAmericanoRound only supports Americano format');
  }
  
  if (options.variant === 'team') {
    if (!teams || teams.length < 2) {
      throw new Error('Team Americano requires at least 2 teams');
    }
    
    // Extract previous team matches for Swiss-style pairing
    const previousTeamMatches: Array<{ team1: number; team2: number; round: number }> = [];
    
    // For simplicity, we'll implement basic team pairing here
    // In a full implementation, you'd track team performance and create Swiss pairings
    const courtMatches = generateAmericanoTeamPairings(teams, courts, previousTeamMatches);
    
    return {
      roundNum: currentRound + 1,
      courts: courtMatches
    };
  } else {
    // Individual Americano
    const history = buildPartnerHistory(previousRounds, players);
    const { playing, resting } = selectPlayersForRound(players, courts, history);
    
    const courtMatches = generateAmericanoIndividualPairings(playing, courts, history);
    
    return {
      roundNum: currentRound + 1,
      courts: courtMatches
    };
  }
}

// Utility function to check if Americano tournament is complete
export function isAmericanoComplete(
  previousRounds: RoundState[],
  players: UUID[],
  variant: AmericanoVariant = 'individual'
): boolean {
  if (variant === 'team') {
    // For team Americano, check if all teams have played each other
    // This would require team data, so for now return false
    return false;
  } else {
    // Individual Americano: check if every player has partnered with every other player
    const history = buildPartnerHistory(previousRounds, players);
    
    for (const playerId of players) {
      const playerHistory = history.get(playerId);
      if (!playerHistory) continue;
      
      // Each player should have partnered with (players.length - 1) other players
      const expectedPartners = players.length - 1;
      if (playerHistory.partners.size < expectedPartners) {
        return false;
      }
    }
    
    return true;
  }
}

// Utility function to calculate estimated rounds for Americano
export function calculateAmericanoRounds(
  playerCount: number, 
  courts: number, 
  variant: AmericanoVariant = 'individual'
): number {
  if (variant === 'team') {
    const teamCount = Math.floor(playerCount / 2);
    const maxMatchesPerRound = courts;
    
    if (teamCount <= courts * 2) {
      // Round-robin possible
      return Math.ceil((teamCount * (teamCount - 1)) / (2 * maxMatchesPerRound));
    } else {
      // Swiss-style - estimate based on tournament theory
      return Math.ceil(Math.log2(teamCount)) + 2;
    }
  } else {
    // Individual Americano
    const maxPlayersPerRound = courts * 4;
    
    if (playerCount <= maxPlayersPerRound) {
      // Everyone plays every round, aim for partner-everyone-once
      return Math.max(6, playerCount - 1);
    } else {
      // With rest pool, estimate based on target games per player
      const targetGamesPerPlayer = Math.min(6, playerCount - 1);
      return Math.ceil((playerCount * targetGamesPerPlayer) / maxPlayersPerRound);
    }
  }
}
