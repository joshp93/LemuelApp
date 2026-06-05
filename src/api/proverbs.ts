import { ProverbSchema } from "../models/proverb";
import { LEMUEL_API_BASE_URL } from "./constants";

export const getProverbForTheDay = (version: string, date?: string) => {
  console.debug("Fetching proverb", version, date);
  return fetch(
    `${LEMUEL_API_BASE_URL}/${version}${date ? `?date=${date}` : ""}`,
    {
      method: "GET",
    },
  )
    .then((res) => res.json())
    .then((data) => ProverbSchema.parse(data))
    .catch((error) => {
      console.error("Error fetching proverb:", error);
      throw error;
    });
};
