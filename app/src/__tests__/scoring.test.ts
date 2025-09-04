import { describe, it, expect } from 'vitest';

import { roundPointsForPlayer } from '@/lib/scoring';

describe('roundPointsForPlayer', () => {
  it('awards base + margin + defend bonuses capped at 5', () => {
    const pts = roundPointsForPlayer({
      won: true,
      court: 1,
      pointDiff: 12,
      defendedC1: true,
      promoted: false,
    });
    expect(pts).toBeLessThanOrEqual(5);
    expect(pts).toBe(5); // 3 + 1 +1 capped
  });

  it('awards zero on loss', () => {
    const pts = roundPointsForPlayer({
      won: false,
      court: 3,
      pointDiff: -8,
      defendedC1: false,
      promoted: false,
    });
    expect(pts).toBe(0);
  });
});
