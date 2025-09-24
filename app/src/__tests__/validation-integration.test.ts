import { describe, it, expect } from 'vitest';
import {
  validateTournamentConfig,
  validateScoreEntry,
  validatePlayerRegistration,
  validateTournamentIntegrity,
  TournamentConfigSchema,
  ScoreEntrySchema,
  PlayerRegistrationSchema,
} from '@/lib/validation';
import type { RoundState } from '@/lib/types';

describe('Tournament Validation - Integration Tests', () => {
  // Test UUIDs for consistent testing
  const testUUIDs = {
    p1: '550e8400-e29b-41d4-a716-446655440001',
    p2: '550e8400-e29b-41d4-a716-446655440002', 
    p3: '550e8400-e29b-41d4-a716-446655440003',
    p4: '550e8400-e29b-41d4-a716-446655440004',
    p5: '550e8400-e29b-41d4-a716-446655440005',
    p6: '550e8400-e29b-41d4-a716-446655440006',
    p7: '550e8400-e29b-41d4-a716-446655440007',
    p8: '550e8400-e29b-41d4-a716-446655440008',
    club: '550e8400-e29b-41d4-a716-446655440100',
    event: '550e8400-e29b-41d4-a716-446655440200',
  };

  describe('Tournament Configuration Validation', () => {
    it('should validate correct winners-court configuration', () => {
      const config = {
        name: 'Tournament A',
        format: 'winners-court' as const,
        courts: 3,
        variant: 'individual' as const,
        points_per_game: 21,
        round_minutes: 20,
      };

      const result = validateTournamentConfig(config);
      expect(result.success).toBe(true);
    });

    it('should validate correct americano configuration', () => {
      const config = {
        name: 'Tournament B',
        format: 'americano' as const,
        courts: 2,
        variant: 'team' as const,
        points_per_game: 32,
        round_minutes: 15,
      };

      const result = validateTournamentConfig(config);
      expect(result.success).toBe(true);
    });

    it('should reject configuration without scoring method', () => {
      const config = {
        courts: 2,
        variant: 'individual',
      };

      const result = TournamentConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject invalid court numbers', () => {
      const config = {
        name: 'Invalid Tournament',
        format: 'winners-court' as const,
        courts: 0,
        variant: 'individual' as const,
        points_per_game: 21,
      };

      const result = validateTournamentConfig(config);
      expect(result.success).toBe(false);
    });

    it('should reject wildcard config without start round', () => {
      const config = {
        name: 'Wildcard Tournament',
        format: 'winners-court' as const,
        courts: 3,
        variant: 'individual' as const,
        wildcard_enabled: true,
        points_per_game: 21,
        // Missing wildcard_start_round
      };

      const result = validateTournamentConfig(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Score Entry Validation', () => {
    it('should validate correct score entry', () => {
      const score = {
        courtNum: 1,
        scoreA: 21,
        scoreB: 15,
        eventId: testUUIDs.event,
        roundNum: 1,
      };

      const result = validateScoreEntry(score);
      expect(result.success).toBe(true);
    });

    it('should reject tied scores', () => {
      const score = {
        courtNum: 1,
        scoreA: 21,
        scoreB: 21,
        eventId: testUUIDs.event,
        roundNum: 1,
      };

      const result = validateScoreEntry(score);
      expect(result.success).toBe(false);
    });

    it('should reject invalid scores', () => {
      const score = {
        courtNum: 1,
        scoreA: -5,
        scoreB: 15,
        eventId: testUUIDs.event,
        roundNum: 1,
      };

      const result = validateScoreEntry(score);
      expect(result.success).toBe(false);
    });

    it('should reject invalid event ID', () => {
      const score = {
        courtNum: 1,
        scoreA: 21,
        scoreB: 15,
        eventId: 'not-a-uuid',
        roundNum: 1,
      };

      const result = validateScoreEntry(score);
      expect(result.success).toBe(false);
    });
  });

  describe('Player Registration Validation', () => {
    it('should validate correct player registration', () => {
      const player = {
        full_name: 'John Doe',
        elo: 1500,
        club_id: testUUIDs.club,
      };

      const result = validatePlayerRegistration(player);
      expect(result.success).toBe(true);
    });

    it('should reject names with invalid characters', () => {
      const player = {
        full_name: 'John@Doe#123',
        club_id: testUUIDs.club,
      };

      const result = validatePlayerRegistration(player);
      expect(result.success).toBe(false);
    });

    it('should reject names that are too short', () => {
      const player = {
        full_name: 'J',
        club_id: testUUIDs.club,
      };

      const result = validatePlayerRegistration(player);
      expect(result.success).toBe(false);
    });

    it('should apply default ELO when not provided', () => {
      const player = {
        full_name: 'Jane Smith',
        club_id: testUUIDs.club,
      };

      const result = validatePlayerRegistration(player);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.elo).toBe(1200);
      }
    });
  });

  describe('Tournament Integrity Validation', () => {
    it('should validate correct tournament structure', () => {
      const rounds: RoundState[] = [
        {
          roundNum: 1,
          courts: [
            {
              court_num: 1,
              teamA: [testUUIDs.p1, testUUIDs.p2] as [string, string],
              teamB: [testUUIDs.p3, testUUIDs.p4] as [string, string],
              scoreA: 21,
              scoreB: 15
            },
            {
              court_num: 2,
              teamA: [testUUIDs.p5, testUUIDs.p6] as [string, string],
              teamB: [testUUIDs.p7, testUUIDs.p8] as [string, string],
              scoreA: 18,
              scoreB: 21
            }
          ]
        }
      ];

      const result = validateTournamentIntegrity(rounds);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate players in same round', () => {
      const rounds: RoundState[] = [
        {
          roundNum: 1,
          courts: [
            { 
              court_num: 1, 
              teamA: [testUUIDs.p1, testUUIDs.p2] as [string, string], 
              teamB: [testUUIDs.p3, testUUIDs.p4] as [string, string], 
              scoreA: 21, 
              scoreB: 15 
            },
            { 
              court_num: 2, 
              teamA: [testUUIDs.p1, testUUIDs.p6] as [string, string], // p1 appears twice
              teamB: [testUUIDs.p7, testUUIDs.p8] as [string, string], 
              scoreA: 18, 
              scoreB: 21 
            },
          ],
        },
      ];

      const result = validateTournamentIntegrity(rounds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate players'))).toBe(true);
    });

    it('should detect inconsistent player count across rounds', () => {
      const rounds: RoundState[] = [
        {
          roundNum: 1,
          courts: [
            { 
              court_num: 1, 
              teamA: [testUUIDs.p1, testUUIDs.p2] as [string, string], 
              teamB: [testUUIDs.p3, testUUIDs.p4] as [string, string], 
              scoreA: 21, 
              scoreB: 15 
            },
            { 
              court_num: 2, 
              teamA: [testUUIDs.p5, testUUIDs.p6] as [string, string], 
              teamB: [testUUIDs.p7, testUUIDs.p8] as [string, string], 
              scoreA: 18, 
              scoreB: 21 
            },
          ],
        },
        {
          roundNum: 2,
          courts: [
            { 
              court_num: 1, 
              teamA: [testUUIDs.p1, testUUIDs.p2] as [string, string], 
              teamB: [testUUIDs.p3, testUUIDs.p4] as [string, string], 
              scoreA: 21, 
              scoreB: 19 
            },
            // Missing second court - different player count
          ],
        },
      ];

      const result = validateTournamentIntegrity(rounds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Inconsistent player count'))).toBe(true);
    });

    it('should handle invalid round data gracefully', () => {
      const invalidRounds: any[] = [
        {
          roundNum: 'not-a-number',
          courts: [],
        },
      ];

      const result = validateTournamentIntegrity(invalidRounds);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed data gracefully', () => {
      const result = TournamentConfigSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should validate UUID formats strictly', () => {
      const invalidScore = {
        courtNum: 1,
        scoreA: 21,
        scoreB: 15,
        eventId: '12345',  // Not a valid UUID
        roundNum: 1,
      };

      const result = ScoreEntrySchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });

    it('should handle extreme values appropriately', () => {
      const extremeConfig = {
        format: 'winners-court',
        courts: 100,  // Very high number
        points_per_game: 1000,  // Very high score
      };

      const result = TournamentConfigSchema.safeParse(extremeConfig);
      expect(result.success).toBe(false);
    });
  });
});