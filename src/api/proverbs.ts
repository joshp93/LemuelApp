import { ProverbSchema } from "../models/proverb";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

export const getProverbForTheDay = (version: string, date?: string) => {
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
};
