import { jwtDecode } from "jwt-decode";

/**
 * Gets the expiration time of a JWT token.
 * @param token The JWT token to check
 * @returns The expiration timestamp in milliseconds, or null if invalid token
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (decoded.exp) {
      return decoded.exp * 1000;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expired.
 * @param token The JWT token to check
 * @returns True if token is expired, false if valid or invalid token
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return false;
  }
  return Date.now() >= expiration;
}

/**
 * Gets the time remaining until a token expires.
 * @param token The JWT token to check
 * @returns Milliseconds until expiration, or 0 if expired/invalid
 */
export function getTimeUntilExpiration(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return 0;
  }
  const timeRemaining = expiration - Date.now();
  return Math.max(0, timeRemaining);
}

/**
 * Checks if a token is about to expire (within threshold).
 * Useful for proactive refresh before expiration.
 * @param token The JWT token to check
 * @param thresholdMs Milliseconds before expiration to consider as "about to expire" (default: 5 minutes)
 * @returns True if token will expire within threshold
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdMs: number = 5 * 60 * 1000,
): boolean {
  const timeRemaining = getTimeUntilExpiration(token);
  return timeRemaining < thresholdMs;
}
