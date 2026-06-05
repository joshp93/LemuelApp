import { getValidIdToken } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

export async function recordMeditationCompletion(
  uuid: string,
  date: string,
): Promise<void> {
  try {
    const token = await getValidIdToken();
    if (!token) {
      remoteLog("warn", "[Meditation] No valid ID token, skipping");
      return;
    }

    remoteLog("debug", "[Meditation] Recording completion", { uuid, date });
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/accounts/${uuid}/meditations/${date}`,
      {
        method: "POST",
        headers: { Authorization: token },
      },
    );

    if (!response.ok) {
      remoteLog("warn", "[Meditation] API returned non-OK", {
        status: response.status,
      });
    }
  } catch (error) {
    remoteLog("error", "[Meditation] Failed to record", { error });
  }
}
