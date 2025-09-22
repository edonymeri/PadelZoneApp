import { describe, it, expect } from 'vitest';

import { expectedScore, updateEloTeamVsTeam } from '@/lib/elo';
import { DEFAULT_CLUB_SETTINGS } from '@/lib/clubSettings';

describe('elo system', () => {
  it('expectedScore is 0.5 for equal ratings', () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 2);
  });

  it('updateEloTeamVsTeam awards positive delta for underdog win', () => {
    const eloConfig = DEFAULT_CLUB_SETTINGS.elo_config;
    const delta = updateEloTeamVsTeam(1100, 1400, true, eloConfig, 'winners-court');
    expect(delta).toBeGreaterThan(0);
  });
});
