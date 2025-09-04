// Utility to diff player court assignments between two rounds
import type { CourtMatch, UUID } from '@/lib/types';

export interface PlayerMovement {
  playerId: UUID;
  fromCourt: number | null; // null if new (should not happen mid-event)
  toCourt: number;
  changed: boolean;
}

export interface RoundDiffResult {
  movements: PlayerMovement[];
  movedPlayerIds: Set<UUID>;
}

export function diffRounds(prev: CourtMatch[] | null | undefined, next: CourtMatch[]): RoundDiffResult {
  const movements: PlayerMovement[] = [];
  const moved = new Set<UUID>();
  const playerToPrevCourt = new Map<UUID, number>();

  if (prev) {
    prev.forEach(ct => {
      [...ct.teamA, ...ct.teamB].forEach(p => playerToPrevCourt.set(p, ct.court_num));
    });
  }

  next.forEach(ct => {
    [...ct.teamA, ...ct.teamB].forEach(p => {
      const fromCourt = playerToPrevCourt.get(p) ?? null;
      const changed = fromCourt != null && fromCourt !== ct.court_num;
      if (changed) moved.add(p);
      movements.push({ playerId: p, fromCourt, toCourt: ct.court_num, changed });
    });
  });

  return { movements, movedPlayerIds: moved };
}
