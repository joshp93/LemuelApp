import { useEffect, useState } from "react";
import { getProverbForTheDay } from "../api/proverbs";
import { Proverb } from "../models/proverb";

export function useProverbForTheDay() {
  const [proverb, setProverb] = useState<Proverb | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProverbForTheDay()
      .then((data) => {
        setProverb(data);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.stack ?? err.message);
        setProverb(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { proverb, loading, error };
}
