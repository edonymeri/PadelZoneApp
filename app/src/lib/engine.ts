
import type { CourtMatch, RoundState, UUID, EngineOptions } from "./types";

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

function splitCross(arrivals: UUID[]): { teamA: UUID[]; teamB: UUID[] } {
  const [a, b, c, d] = arrivals;
  return { teamA: [a, c], teamB: [b, d] };
}

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
    let [a, b, cId, d] = arrivals;
    let teamA: UUID[] = [a, cId];
    let teamB: UUID[] = [b, d];

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
