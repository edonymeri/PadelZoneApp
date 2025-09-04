// Polyfill global crypto.getRandomValues for older Node versions (<18)
try {
  if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
    const { webcrypto } = require('crypto');
    // Assign webcrypto which provides getRandomValues
    globalThis.crypto = webcrypto;
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[crypto-polyfill] Failed to attach webcrypto:', e);
}
