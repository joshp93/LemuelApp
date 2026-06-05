import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

/**
 * Fetches the list of available Bible versions from the backend.
 * @returns A sorted array of version strings, or an empty array on failure.
 */
export const getAvailableVersions = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${LEMUEL_API_BASE_URL}/available-versions`, {
      method: "GET",
    });
    const data = (await response.json()) as string[];
    return data;
  } catch (error: any) {
    remoteLog(
      "error",
      "[AvailableVersions] Error fetching available versions",
      { error },
    );
    return [];
  }
};
