import { type DailyProverb, DailyProverbSchema } from "../models/daily-proverb";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

export const getDailyProverbsForMonth = async (
  month: string,
): Promise<DailyProverb[]> => {
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
};
