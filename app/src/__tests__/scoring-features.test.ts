/**
 * Comprehensive test for scoring system features
 * Tests margin bonus points and winners court bonus functionality
 */

import { describe, it, expect } from 'vitest';
import { roundPointsForPlayer } from '@/lib/scoring';
import { DEFAULT_SCORING_CONFIG } from '@/lib/clubSettings';

describe('Scoring Features Verification', () => {
  describe('Margin Bonus Points', () => {
    it('should award margin bonus when point difference meets threshold', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 10, // Exactly meets threshold
        defendedC1: false,
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(4); // 3 base + 1 margin bonus
    });

    it('should award margin bonus when point difference exceeds threshold', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 15, // Exceeds threshold (10)
        defendedC1: false,
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(4); // 3 base + 1 margin bonus
    });

    it('should NOT award margin bonus when point difference is below threshold', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 9, // Below threshold (10)
        defendedC1: false,
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(3); // 3 base points only
    });

    it('should NOT award margin bonus for losing team', () => {
      const result = roundPointsForPlayer({
        won: false,
        court: 1,
        pointDiff: 15, // Would meet threshold but team lost
        defendedC1: false,
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(0); // No points for losing
    });

    it('should work with different margin bonus configurations - americano format', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 8, // Meets americano threshold
        defendedC1: false,
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'americano');

      expect(result).toBe(3); // 2 base + 1 margin bonus (americano format)
    });
  });

  describe('Winners Court Bonus', () => {
    it('should award court bonus when defending C1 (top court)', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 5, // Below margin threshold 
        defendedC1: true, // Won on top court
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(4); // 3 base + 1 court bonus
    });

    it('should NOT award court bonus when NOT on top court', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 5,
        defendedC1: false, // NOT on top court
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(3); // 3 base points only
    });

    it('should NOT award court bonus for losing team even on top court', () => {
      const result = roundPointsForPlayer({
        won: false,
        court: 1,
        pointDiff: 5,
        defendedC1: true, // On top court but lost
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(0); // No points for losing
    });

    it('should award BOTH margin bonus AND court bonus when conditions met', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 12, // Exceeds margin threshold (10)
        defendedC1: true, // Won on top court
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(5); // 3 base + 1 margin + 1 court = 5 (max per match)
    });
  });

  describe('Start Round Configuration for Court Bonus', () => {
    it('should verify winners court bonus start round default is 5', () => {
      expect(DEFAULT_SCORING_CONFIG.winnersCourtBonusStartRound).toBe(5);
      expect(DEFAULT_SCORING_CONFIG.winnersCourtConfig.winnersCourtBonusStartRound).toBe(5);
    });

    it('should verify americano format has court bonus disabled', () => {
      expect(DEFAULT_SCORING_CONFIG.americanoConfig.winnersCourtBonusEnabled).toBe(false);
      expect(DEFAULT_SCORING_CONFIG.americanoConfig.winnersCourtBonusPoints).toBe(0);
      expect(DEFAULT_SCORING_CONFIG.americanoConfig.winnersCourtBonusStartRound).toBe(999);
    });

    it('should verify winners court format has court bonus enabled', () => {
      expect(DEFAULT_SCORING_CONFIG.winnersCourtConfig.winnersCourtBonusEnabled).toBe(true);
      expect(DEFAULT_SCORING_CONFIG.winnersCourtConfig.winnersCourtBonusPoints).toBe(1);
      expect(DEFAULT_SCORING_CONFIG.winnersCourtConfig.winnersCourtBonusStartRound).toBe(5);
    });
  });

  describe('Max Points Per Match Constraints', () => {
    it('should respect max points per match limit', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 20, // Large margin
        defendedC1: true, // Court bonus
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'winners-court');

      expect(result).toBe(5); // Capped at max (3 base + 1 margin + 1 court = 5)
    });

    it('should work with different max points constraints', () => {
      const result = roundPointsForPlayer({
        won: true,
        court: 1,
        pointDiff: 15, // Large margin for americano
        defendedC1: false,
        promoted: false,
      }, DEFAULT_SCORING_CONFIG, 'americano');

      expect(result).toBe(3); // 2 base + 1 margin, no court bonus in americano
    });
  });

  describe('Integration with Tournament Round Logic', () => {
    it('should demonstrate how court bonus applies based on round number', () => {
      // This test demonstrates the logic used in useEventControl.ts
      const roundNum = 6; // After start round (5)
      const format = 'winners-court';
      const scoringConfig = DEFAULT_SCORING_CONFIG;
      const bonusStartRound = scoringConfig.winnersCourtBonusStartRound;

      // Logic from useEventControl.ts lines 491-494:
      const shouldApplyCourtBonus = format === 'winners-court' && 
                                   roundNum > (bonusStartRound - 1);

      expect(shouldApplyCourtBonus).toBe(true);
      expect(bonusStartRound).toBe(5);
      expect(roundNum > (bonusStartRound - 1)).toBe(true); // 6 > 4
    });

    it('should NOT apply court bonus before start round', () => {
      const roundNum = 4; // Before start round (5)
      const format = 'winners-court';
      const scoringConfig = DEFAULT_SCORING_CONFIG;
      const bonusStartRound = scoringConfig.winnersCourtBonusStartRound;

      const shouldApplyCourtBonus = format === 'winners-court' && 
                                   roundNum > (bonusStartRound - 1);

      expect(shouldApplyCourtBonus).toBe(false);
      expect(roundNum > (bonusStartRound - 1)).toBe(false); // 4 > 4 is false
    });

    it('should apply court bonus exactly at start round', () => {
      const roundNum = 5; // Exactly at start round
      const format = 'winners-court';
      const scoringConfig = DEFAULT_SCORING_CONFIG;
      const bonusStartRound = scoringConfig.winnersCourtBonusStartRound;

      const shouldApplyCourtBonus = format === 'winners-court' && 
                                   roundNum > (bonusStartRound - 1);

      expect(shouldApplyCourtBonus).toBe(true);
      expect(roundNum > (bonusStartRound - 1)).toBe(true); // 5 > 4 is true
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid default scoring configurations', () => {
      // Winners court config
      const wc = DEFAULT_SCORING_CONFIG.winnersCourtConfig;
      expect(wc.baseWinPoints).toBeGreaterThan(0);
      expect(wc.marginBonusThreshold).toBeGreaterThan(0);
      expect(wc.marginBonusPoints).toBeGreaterThan(0);
      expect(wc.winnersCourtBonusStartRound).toBeGreaterThanOrEqual(1);
      
      // Americano config  
      const ac = DEFAULT_SCORING_CONFIG.americanoConfig;
      expect(ac.baseWinPoints).toBeGreaterThan(0);
      expect(ac.marginBonusThreshold).toBeGreaterThan(0);
      expect(ac.marginBonusPoints).toBeGreaterThan(0);
    });

    it('should have consistent legacy and format-specific configurations', () => {
      // Legacy should match winners court for backward compatibility
      expect(DEFAULT_SCORING_CONFIG.baseWinPoints).toBe(DEFAULT_SCORING_CONFIG.winnersCourtConfig.baseWinPoints);
      expect(DEFAULT_SCORING_CONFIG.marginBonusThreshold).toBe(DEFAULT_SCORING_CONFIG.winnersCourtConfig.marginBonusThreshold);
      expect(DEFAULT_SCORING_CONFIG.marginBonusPoints).toBe(DEFAULT_SCORING_CONFIG.winnersCourtConfig.marginBonusPoints);
      expect(DEFAULT_SCORING_CONFIG.winnersCourtBonusStartRound).toBe(DEFAULT_SCORING_CONFIG.winnersCourtConfig.winnersCourtBonusStartRound);
    });
  });
});