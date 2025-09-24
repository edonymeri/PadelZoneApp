import { describe, it, expect } from 'vitest';

// Test core system integration with actual exported functions
import { expectedScore, updateEloTeamVsTeam } from '@/lib/elo';
import { DEFAULT_CLUB_SETTINGS } from '@/lib/clubSettings';

describe('Core Systems Integration', () => {
  describe('ELO System Integration', () => {
    it('calculates expected scores correctly for equal ratings', () => {
      const result = expectedScore(1200, 1200);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('calculates expected scores correctly for different ratings', () => {
      const higherRated = expectedScore(1400, 1200);
      const lowerRated = expectedScore(1200, 1400);
      
      expect(higherRated).toBeGreaterThan(0.5);
      expect(lowerRated).toBeLessThan(0.5);
      expect(higherRated + lowerRated).toBeCloseTo(1.0, 2);
    });

    it('updates ELO ratings appropriately for upset wins', () => {
      const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
      const underdog_delta = updateEloTeamVsTeam(1100, 1400, true, eloConfig, 'winners-court');
      const favorite_delta = updateEloTeamVsTeam(1400, 1100, false, eloConfig, 'winners-court');
      
      expect(underdog_delta).toBeGreaterThan(0);
      expect(favorite_delta).toBeLessThan(0);
    });

    it('provides consistent ELO calculations', () => {
      const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
      
      // Test multiple scenarios to ensure consistency
      const scenarios = [
        { team1: 1200, team2: 1200, team1Wins: true },
        { team1: 1400, team2: 1200, team1Wins: false }, // upset
        { team1: 1100, team2: 1300, team1Wins: true },  // upset
        { team1: 1500, team2: 1000, team1Wins: true },  // expected
      ];

      scenarios.forEach(scenario => {
        const delta = updateEloTeamVsTeam(
          scenario.team1,
          scenario.team2,
          scenario.team1Wins,
          eloConfig,
          'winners-court'
        );
        
        expect(typeof delta).toBe('number');
        expect(Math.abs(delta)).toBeGreaterThan(0);
        expect(Math.abs(delta)).toBeLessThan(100); // Reasonable bounds
      });
    });
  });

  describe('Club Settings Integration', () => {
    it('provides default configuration values', () => {
      expect(DEFAULT_CLUB_SETTINGS).toBeDefined();
      expect(DEFAULT_CLUB_SETTINGS.elo_config).toBeDefined();
      expect(DEFAULT_CLUB_SETTINGS.scoring_config).toBeDefined();
    });

    it('has valid ELO configuration', () => {
      const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
      
      expect(typeof eloConfig.enabled).toBe('boolean');
      expect(typeof eloConfig.startingElo).toBe('number');
      expect(eloConfig.startingElo).toBeGreaterThan(0);
    });

    it('has valid scoring configuration', () => {
      const scoringConfig = DEFAULT_CLUB_SETTINGS.scoring_config;
      
      expect(typeof scoringConfig.minPointsPerGame).toBe('number');
      expect(scoringConfig.minPointsPerGame).toBeGreaterThan(0);
    });

    it('configurations work together', () => {
      const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
      const scoringConfig = DEFAULT_CLUB_SETTINGS.scoring_config;
      
      // Test that configurations can be used together
      expect(eloConfig).toBeDefined();
      expect(scoringConfig).toBeDefined();
      
      // ELO system should work with any valid score
      const delta = updateEloTeamVsTeam(1200, 1200, true, eloConfig, 'winners-court');
      expect(typeof delta).toBe('number');
    });
  });

  describe('Configuration Validation', () => {
    it('validates ELO system bounds', () => {
      const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
      
      // Test extreme rating differences
      const hugeDelta = updateEloTeamVsTeam(2000, 800, false, eloConfig, 'winners-court');
      const smallDelta = updateEloTeamVsTeam(1200, 1201, true, eloConfig, 'winners-court');
      
      expect(Math.abs(hugeDelta)).toBeGreaterThan(Math.abs(smallDelta));
    });

    it('handles edge cases in expected score', () => {
      // Test equal ratings
      expect(expectedScore(1200, 1200)).toBe(0.5);
      
      // Test extreme differences
      const veryHighVsLow = expectedScore(2000, 800);
      const veryLowVsHigh = expectedScore(800, 2000);
      
      expect(veryHighVsLow).toBeGreaterThan(0.9);
      expect(veryLowVsHigh).toBeLessThan(0.1);
      expect(veryHighVsLow + veryLowVsHigh).toBeCloseTo(1.0, 5);
    });
  });

  describe('System Reliability', () => {
    it('maintains mathematical consistency', () => {
      // Test that ELO changes are symmetric
      const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
      
      const team1Rating = 1300;
      const team2Rating = 1200;
      
      const team1WinsDelta = updateEloTeamVsTeam(team1Rating, team2Rating, true, eloConfig, 'winners-court');
      const team2WinsDelta = updateEloTeamVsTeam(team2Rating, team1Rating, true, eloConfig, 'winners-court');
      
      // Both should be positive (winners gain points)
      expect(team1WinsDelta).toBeGreaterThan(0);
      expect(team2WinsDelta).toBeGreaterThan(0);
      
      // Underdog (team2) should gain more points when winning
      expect(team2WinsDelta).toBeGreaterThan(team1WinsDelta);
    });

    it('provides predictable expected scores', () => {
      const testPairs = [
        [1200, 1200],
        [1300, 1200],
        [1400, 1200],
        [1500, 1200],
      ];
      
      let previousScore = 0;
      testPairs.forEach(([rating1, rating2]) => {
        const score = expectedScore(rating1, rating2);
        expect(score).toBeGreaterThan(previousScore);
        expect(score).toBeLessThan(1);
        expect(score).toBeGreaterThan(0);
        previousScore = score;
      });
    });
  });

  describe('Integration Workflow', () => {
    it('supports complete match processing workflow', () => {
      // Simulate a complete match workflow
      const team1Elo = 1250;
      const team2Elo = 1180;
      const team1Wins = true;
      
      // 1. Calculate expected outcome
      const expectedTeam1Score = expectedScore(team1Elo, team2Elo);
      expect(expectedTeam1Score).toBeGreaterThan(0.5); // Favorite should have > 50% chance
      
      // 2. Process match result
      const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
      const eloDelta = updateEloTeamVsTeam(team1Elo, team2Elo, team1Wins, eloConfig, 'winners-court');
      
      // 3. Validate result consistency
      expect(eloDelta).toBeGreaterThan(0); // Winner gains points
      expect(eloDelta).toBeLessThan(50); // Reasonable gain for expected win
      
      // 4. Calculate new ratings
      const newTeam1Elo = team1Elo + eloDelta;
      const newTeam2Elo = team2Elo - eloDelta;
      
      expect(newTeam1Elo).toBeGreaterThan(team1Elo);
      expect(newTeam2Elo).toBeLessThan(team2Elo);
    });
  });
});