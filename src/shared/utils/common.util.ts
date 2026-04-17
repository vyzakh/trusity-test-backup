import { randomBytes } from 'crypto';
import * as sanitizeHtml from 'sanitize-html';
import * as util from 'util';
import * as he from 'he';

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isDefinedStrict<T>(value: T | undefined | null): value is NonNullable<T> {
  return value != null;
}

export function genRandomBytes(size = 24) {
  return randomBytes(size).toString('hex');
}

export function sanitizeInput(input?: string | null, options?: sanitizeHtml.IOptions) {
  if (!isDefinedStrict(input)) return input;

  const sanitized = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {}, ...options });
  return he.decode(sanitized)
}

export function noop() {}

export function formatUnhandledPromiseReason(reason: unknown) {
  if (reason instanceof Error) {
    return reason.message;
  }

  if (typeof reason === 'string') {
    return reason;
  }

  try {
    return util.inspect(reason, { depth: 5, breakLength: 80 });
  } catch {
    return String(reason);
  }
}

export function roundScore(score: number) {
  if (score > 0) {
    return Math.round(score);
  }
  return 0;
}

/**
 * Normalize a number to ensure it's a finite value.
 * if the value is undefined, null, NaN, or infinite, it returns 0.
 */
export function normalizeNumber(value?: number | null): number {
  if (!value) return 0;

  return Number.isFinite(value) ? value : 0;
}
