import { withCache } from "../cache/store";
import { type DailyProverb, DailyProverbSchema } from "../models/daily-proverb";
import { pad } from "../utils/format";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

/** How long a month's calendar stays fresh while the month is still running. */
const CURRENT_MONTH_TTL_MS = 60 * 60 * 1000;

/**
 * How long a month's calendar may be cached.
 *
 * A month that has ended cannot gain entries, so it is cached indefinitely.
 *
 * @param month - The month as `YYYY-MM`.
 * @returns The lifetime in milliseconds.
 */
function ttlForMonth(month: string): number {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  return month < currentMonth ? Number.POSITIVE_INFINITY : CURRENT_MONTH_TTL_MS;
}

/**
 * Fetches the dates that have a proverb in a month.
 *
 * @param month - The month as `YYYY-MM`.
 * @returns The month's daily proverbs.
 * @throws If the request fails.
 */
export const getDailyProverbsForMonth = async (
  month: string,
): Promise<DailyProverb[]> =>
  withCache(`calendar:${month}`, ttlForMonth(month), async () => {
    remoteLog("debug", "[DailyProverbs] Fetching month", { month });
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/get-proverbs?month=${month}`,
      { method: "GET" },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch daily proverbs: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    return (data.items ?? []).map((item: unknown) =>
      DailyProverbSchema.parse(item),
    );
  });
