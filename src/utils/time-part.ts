/**
 * Parses one part of a time — an hour or a minute — out of a picker value.
 *
 * The fallback is used only when the value does not parse. `"0"` is a real
 * hour (midnight) and parses to `0`, so it must never be replaced by the
 * fallback; testing the parsed number for truthiness would silently rewrite
 * midnight as the default time.
 *
 * @param value - The picker value, e.g. `"0"`, `"19"`, or `undefined` when the
 *                picker has not supplied one yet.
 * @param fallback - The value to use when `value` does not parse.
 * @returns The parsed number, or `fallback`.
 */
export function parseTimePart(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
