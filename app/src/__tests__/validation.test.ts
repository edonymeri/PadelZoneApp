import { describe, it, expect } from 'vitest';

import { validatePlayerCountForFormat } from '@/lib/validation';

describe('validatePlayerCountForFormat (format-specific rules)', () => {
  it('allows Americano events to roster one extra player for rotating rests', () => {
    const result = validatePlayerCountForFormat(9, 'americano', 2);
    expect(result.success).toBe(true);
  });

  it('rejects Americano rosters that are below the required court capacity', () => {
    const result = validatePlayerCountForFormat(7, 'americano', 2);
    expect(result.success).toBe(false);
    expect(result.error).toMatch('at least 8 players');
  });

  it('rejects Americano odd counts that cannot be covered by a single rest slot', () => {
    const result = validatePlayerCountForFormat(11, 'americano', 2);
    expect(result.success).toBe(false);
    expect(result.error).toMatch('rotating rest slot');
  });

  it("keeps Winner's Court requirements unchanged", () => {
    const result = validatePlayerCountForFormat(8, 'winners-court', 2);
    expect(result.success).toBe(true);
  });
});
