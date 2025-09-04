import { nextRound } from '@/lib/engine';
import type { RoundState, EngineOptions } from '@/lib/types';

export interface AdvancePolicy {
  antiRepeatWindow: number;
  wildcard?: {
    active: boolean;
    intensity: 'light' | 'medium' | 'chaotic';
  };
}

export interface AdvanceResult {
  next: RoundState;
  meta: {
    wildcardApplied: boolean;
    partnerSwaps: number; // placeholder (could be computed by diffing pairs)
  };
}

// Placeholder for wildcard transformation (extend later)
function applyWildcard(round: RoundState, intensity: string): RoundState {
  if (intensity === 'light') return round;
  // For future: shuffle logic based on intensity
  return round;
}

export function advanceRound(
  current: RoundState,
  previous: RoundState[],
  policy: AdvancePolicy
): AdvanceResult {
  const engineOpts: EngineOptions = { antiRepeatWindow: policy.antiRepeatWindow };
  let base = nextRound(current, engineOpts, previous);
  let wildcardApplied = false;
  if (policy.wildcard?.active) {
    base = applyWildcard(base, policy.wildcard.intensity);
    wildcardApplied = true;
  }
  return { next: base, meta: { wildcardApplied, partnerSwaps: 0 } };
}
