import { getValidIdToken } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";

export async function recordMeditationCompletion(
  uuid: string,
  date: string,
): Promise<void> {
  try {
    const token = await getValidIdToken();
    if (!token) {
      console.warn("[Meditation] No valid ID token, skipping");
      return;
    }

    console.debug(
      `[Meditation] Recording completion for user ${uuid} on ${date}`,
    );
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/accounts/${uuid}/meditations/${date}`,
      {
        method: "POST",
        headers: { Authorization: token },
      },
    );

    if (!response.ok) {
      console.warn(`[Meditation] API returned ${response.status}`);
    }
  } catch (error) {
    console.error("[Meditation] Failed to record:", error);
  }
}
