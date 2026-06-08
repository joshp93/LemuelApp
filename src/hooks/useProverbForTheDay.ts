import { useCallback, useEffect, useState } from "react";
import { getAvailableVersions } from "../api/available-versions";
import { getProverbForTheDay } from "../api/proverbs";
import {
  getChosenVersion,
  removeChosenVersion,
  saveChosenVersion,
} from "../api/version-storage";
import { Proverb } from "../models/proverb";

const DEFAULT_VERSION = "niv";

export function useProverbForTheDay() {
  const [proverb, setProverb] = useState<Proverb | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      try {
        const [storedVersion, versions] = await Promise.all([
          getChosenVersion(),
          getAvailableVersions(),
        ]);

        if (cancelled) return;

        setAvailableVersions(versions);

        let effectiveVersion: string | null = null;

        if (storedVersion && versions.includes(storedVersion)) {
          effectiveVersion = storedVersion;
        } else if (storedVersion && !versions.includes(storedVersion)) {
          await removeChosenVersion();
        }

        if (!effectiveVersion) {
          effectiveVersion = versions.includes(DEFAULT_VERSION)
            ? DEFAULT_VERSION
            : (versions[0] ?? null);
        }

        if (effectiveVersion) {
          setSelectedVersion(effectiveVersion);
          const data = await getProverbForTheDay(effectiveVersion);
          if (!cancelled) {
            setProverb(data);
            setError(null);
          }
        } else if (!cancelled) {
          setError("No bible versions available");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.stack ?? err.message);
          setProverb(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const changeVersion = useCallback(async (version: string) => {
    setSelectedVersion(version);
    setLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([
        getProverbForTheDay(version),
        saveChosenVersion(version),
      ]);
      setProverb(data);
    } catch (err: any) {
      setError(err.stack ?? err.message);
      setProverb(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedVersion) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProverbForTheDay(selectedVersion);
      setProverb(data);
    } catch (err: any) {
      setError(err.stack ?? err.message);
      setProverb(null);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion]);

  return {
    proverb,
    loading,
    error,
    selectedVersion,
    availableVersions,
    changeVersion,
    refresh,
  };
}
