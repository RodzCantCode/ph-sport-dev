/**
 * Logger utility that only logs in development mode
 * Prevents exposing sensitive information in production
 * Works in both client and server contexts
 */
const isDevelopment = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  // Fallback for client-side: assume development if not explicitly production
  return typeof window !== 'undefined';
};

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },
};

