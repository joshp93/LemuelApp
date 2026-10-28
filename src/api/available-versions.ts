import { withCache } from "../cache/store";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

/** The available versions change rarely enough to trust for a day. */
const VERSIONS_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Fetches the list of available Bible versions from the backend.
 *
 * @returns The sorted version keys.
 * @throws If the request fails.
 */
async function fetchAvailableVersions(): Promise<string[]> {
  const response = await fetch(`${LEMUEL_API_BASE_URL}/available-versions`, {
    method: "GET",
  });

  return (await response.json()) as string[];
}

/**
 * Fetches the list of available Bible versions from the backend.
 *
 * A successful list is cached for a day. A failure is not cached, so the next
 * visit can recover.
 *
 * @returns A sorted array of version strings, or an empty array on failure.
 */
export const getAvailableVersions = async (): Promise<string[]> => {
  try {
    return await withCache(
      "available-versions",
      VERSIONS_TTL_MS,
      fetchAvailableVersions,
    );
  } catch (error: any) {
    remoteLog(
      "error",
      "[AvailableVersions] Error fetching available versions",
      { error },
    );
    return [];
  }
};
