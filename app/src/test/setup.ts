// Basic vitest setup - keep it minimal to avoid environment conflicts
import { expect } from 'vitest';

// Set up globals that might be needed for Node environment tests
globalThis.ResizeObserver = globalThis.ResizeObserver || class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};