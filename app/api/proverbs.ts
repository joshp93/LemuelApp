import { ProverbSchema } from "../models/proverb";

export const getProverbForTheDay = () =>
  fetch(
    new Request(
      "https://8ndcvtnwf1.execute-api.eu-west-2.amazonaws.com/prod/kjv",
      {
        method: "GET",
      }
    )
  )
    .then((res) => res.json())
    .then((data) => ProverbSchema.parse(data))
    .catch((error) => {
      console.error("Error fetching proverb:", error);
      throw error;
    });
