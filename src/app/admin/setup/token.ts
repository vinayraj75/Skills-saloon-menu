import { createHash, timingSafeEqual } from 'crypto';

/**
 * Compares the ?t= token from the setup link against ADMIN_SETUP_TOKEN.
 * Timing-safe, and entirely disabled when the env value is missing.
 */
export function tokenMatches(provided: string): boolean {
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected) return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Server-side check whether the setup page is even usable. */
export function setupTokenConfigured(): boolean {
  return Boolean(process.env.ADMIN_SETUP_TOKEN);
}
