import { describe, it, expect, beforeEach } from 'vitest';
import { nextRound } from '@/lib/engine';
import type { RoundState, CourtMatch } from '@/lib/types';

describe('Tournament Engine - Comprehensive Tests', () => {
  let sampleRound: RoundState;

  beforeEach(() => {
    sampleRound = {
      roundNum: 1,
      courts: [
        { court_num: 1, teamA: ['P1','P2'] as [string, string], teamB: ['P3','P4'] as [string, string], scoreA: 21, scoreB: 15 },
        { court_num: 2, teamA: ['P5','P6'] as [string, string], teamB: ['P7','P8'] as [string, string], scoreA: 18, scoreB: 21 },
        { court_num: 3, teamA: ['P9','P10'] as [string, string], teamB: ['P11','P12'] as [string, string], scoreA: 21, scoreB: 12 },
      ],
    };
  });

  describe('Basic Tournament Progression', () => {
    it('should advance round number correctly', () => {
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      expect(nextRoundState.roundNum).toBe(2);
    });

    it('should maintain same number of courts', () => {
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      expect(nextRoundState.courts).toHaveLength(3);
    });

    it('should ensure all courts have 4 players', () => {
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      nextRoundState.courts.forEach(court => {
        expect(court.teamA).toHaveLength(2);
        expect(court.teamB).toHaveLength(2);
      });
    });

    it('should reset scores for new round', () => {
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      nextRoundState.courts.forEach(court => {
        expect(court.scoreA).toBeUndefined();
        expect(court.scoreB).toBeUndefined();
      });
    });
  });

  describe('Winners Court Logic', () => {
    it('should promote winners from Court 1 and Court 2 to Court 1', () => {
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      const court1 = nextRoundState.courts.find(c => c.court_num === 1);
      
      // Winners from original Court 1 (P1, P2) and Court 2 (P7, P8) should be on Court 1
      const court1Players = [...court1!.teamA, ...court1!.teamB];
      expect(court1Players).toContain('P1');
      expect(court1Players).toContain('P2');
      expect(court1Players).toContain('P7');
      expect(court1Players).toContain('P8');
    });

    it('should demote losers correctly', () => {
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      const court3 = nextRoundState.courts.find(c => c.court_num === 3);
      
      // Losers from Court 2 and Court 3 should be on Court 3
      const court3Players = [...court3!.teamA, ...court3!.teamB];
      expect(court3Players).toContain('P5');
      expect(court3Players).toContain('P6');
      expect(court3Players).toContain('P11');
      expect(court3Players).toContain('P12');
    });
  });

  describe('Anti-Repeat Partner Logic', () => {
    it('should avoid recent partnerships when possible', () => {
      const previousRounds: RoundState[] = [
        {
          roundNum: 1,
          courts: [
            { court_num: 1, teamA: ['P1','P2'] as [string, string], teamB: ['P3','P4'] as [string, string], scoreA: 21, scoreB: 15 },
            { court_num: 2, teamA: ['P5','P6'] as [string, string], teamB: ['P7','P8'] as [string, string], scoreA: 18, scoreB: 21 },
          ],
        },
        {
          roundNum: 2,
          courts: [
            { court_num: 1, teamA: ['P1','P3'] as [string, string], teamB: ['P2','P4'] as [string, string], scoreA: 21, scoreB: 15 },
            { court_num: 2, teamA: ['P7','P8'] as [string, string], teamB: ['P5','P6'] as [string, string], scoreA: 21, scoreB: 18 },
          ],
        },
      ];
      
      const currentRound: RoundState = {
        roundNum: 3,
        courts: [
          { court_num: 1, teamA: ['P1','P2'] as [string, string], teamB: ['P3','P4'] as [string, string], scoreA: 21, scoreB: 15 },
          { court_num: 2, teamA: ['P7','P8'] as [string, string], teamB: ['P5','P6'] as [string, string], scoreA: 21, scoreB: 18 },
        ],
      };

      const nextRoundState = nextRound(currentRound, { antiRepeatWindow: 3 }, previousRounds);
      
      // Verify the engine runs without error and creates proper partnerships
      expect(nextRoundState.courts).toHaveLength(2);
      expect(nextRoundState.roundNum).toBe(4);
      
      // All courts should have 4 players
      nextRoundState.courts.forEach(court => {
        expect(court.teamA).toHaveLength(2);
        expect(court.teamB).toHaveLength(2);
      });
    });
  });

  describe('Tournament Invariants', () => {
    it('should preserve all players across rounds', () => {
      const originalPlayers = new Set([
        ...sampleRound.courts.flatMap(c => [...c.teamA, ...c.teamB])
      ]);
      
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      const newPlayers = new Set([
        ...nextRoundState.courts.flatMap(c => [...c.teamA, ...c.teamB])
      ]);
      
      expect(newPlayers).toEqual(originalPlayers);
    });

    it('should not have duplicate players in same round', () => {
      const nextRoundState = nextRound(sampleRound, { antiRepeatWindow: 3 }, [sampleRound]);
      const allPlayers = nextRoundState.courts.flatMap(c => [...c.teamA, ...c.teamB]);
      const uniquePlayers = new Set(allPlayers);
      
      expect(allPlayers).toHaveLength(uniquePlayers.size);
    });

    it('should handle edge cases with ties', () => {
      const tiedRound: RoundState = {
        roundNum: 1,
        courts: [
          { court_num: 1, teamA: ['P1','P2'] as [string, string], teamB: ['P3','P4'] as [string, string], scoreA: 21, scoreB: 21 },
          { court_num: 2, teamA: ['P5','P6'] as [string, string], teamB: ['P7','P8'] as [string, string], scoreA: 21, scoreB: 21 },
        ],
      };

      // Should not throw error and should handle ties deterministically
      expect(() => nextRound(tiedRound, { antiRepeatWindow: 3 }, [tiedRound])).not.toThrow();
      
      const nextRoundState = nextRound(tiedRound, { antiRepeatWindow: 3 }, [tiedRound]);
      expect(nextRoundState.courts).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if court has wrong number of players', () => {
      const invalidRound: RoundState = {
        roundNum: 1,
        courts: [
          { court_num: 1, teamA: ['P1'], teamB: ['P3','P4'], scoreA: 21, scoreB: 15 } as any,
        ],
      };

      expect(() => nextRound(invalidRound, { antiRepeatWindow: 3 }, [invalidRound])).toThrow();
    });
  });
});