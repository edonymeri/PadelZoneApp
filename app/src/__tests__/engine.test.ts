import { describe, it, expect } from 'vitest';

import { nextRound } from '@/lib/engine';
import type { RoundState } from '@/lib/types';

describe('engine.nextRound', () => {
  const baseRound: RoundState = {
    roundNum: 1,
    courts: [
      { court_num: 1, teamA: ['A','B'], teamB: ['C','D'], scoreA: 21, scoreB: 10 },
      { court_num: 2, teamA: ['E','F'], teamB: ['G','H'], scoreA: 15, scoreB: 21 },
    ],
  };

  it('advances round number', () => {
    const r2 = nextRound(baseRound, { antiRepeatWindow: 3 }, [baseRound]);
    expect(r2.roundNum).toBe(2);
  });

  it('produces same number of courts', () => {
    const r2 = nextRound(baseRound, { antiRepeatWindow: 3 }, [baseRound]);
    expect(r2.courts.length).toBe(baseRound.courts.length);
  });
});
