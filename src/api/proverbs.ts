import { withCache } from "../cache/store";
import { ProverbSchema } from "../models/proverb";
import { toLocalDateString } from "../utils/date";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

/** A proverb for a given version and date never changes, so it never expires. */
const PROVERB_TTL_MS = Number.POSITIVE_INFINITY;

/**
 * Fetches the proverb for a date.
 *
 * Results are cached by version and date, so reopening a day, changing back to
 * a version, or opening a meditation for the same day comes from the device.
 * A missing date is cached under the local date that was current when asked.
 *
 * @param version - The Bible version key, e.g. `niv`.
 * @param date - The date as `YYYY-MM-DD`, or undefined for today.
 * @returns The proverb.
 */
export const getProverbForTheDay = (version: string, date?: string) => {
  const day = date ?? toLocalDateString(new Date());

  return withCache(`proverb:${version}:${day}`, PROVERB_TTL_MS, () => {
    remoteLog("debug", "[Proverbs] Fetching proverb", { version, date });
    return fetch(
      `${LEMUEL_API_BASE_URL}/${version}${date ? `?date=${date}` : ""}`,
      {
        method: "GET",
      },
    )
      .then((res) => res.json())
      .then((data) => ProverbSchema.parse(data))
      .catch((error) => {
        remoteLog("error", "[Proverbs] Error fetching proverb", { error });
        throw error;
      });
  });
};
