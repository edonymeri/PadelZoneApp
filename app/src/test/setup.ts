// Vitest setup: polyfill crypto if missing (older Node versions)
import { webcrypto } from 'crypto';

if (!globalThis.crypto || !('getRandomValues' in globalThis.crypto)) {
  // @ts-expect-error polyfilling webcrypto
  globalThis.crypto = webcrypto as any;
}

// Silence console noise from modules during tests if desired
// const originalWarn = console.warn;
// console.warn = (...args) => {
//   if (/(supabase)/i.test(String(args[0]))) return;
//   originalWarn(...args);
// };
