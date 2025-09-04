// Minimal logger abstraction (can be swapped for Sentry/Datadog later)
type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload { [k: string]: unknown }

function write(level: Level, message: string, meta?: LogPayload) {
  const ts = new Date().toISOString();
  // Avoid logging large player objects accidentally
  if (meta && typeof meta === 'object') {
    try {
      const safeMeta = JSON.parse(JSON.stringify(meta));
      // eslint-disable-next-line no-console
      console[level](`[${ts}] ${message}`, safeMeta);
      return;
    } catch {
      // fallback
    }
  }
  // eslint-disable-next-line no-console
  console[level](`[${ts}] ${message}`);
}

export const logger = {
  debug: (m: string, meta?: LogPayload) => write('debug', m, meta),
  info: (m: string, meta?: LogPayload) => write('info', m, meta),
  warn: (m: string, meta?: LogPayload) => write('warn', m, meta),
  error: (m: string, meta?: LogPayload) => write('error', m, meta),
};
