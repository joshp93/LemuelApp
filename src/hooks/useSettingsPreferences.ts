import { useCallback, useEffect, useRef, useState } from "react";
import { getMeditationDuration } from "../settings/meditation-preferences";
import {
  getNotificationMode,
  getNotificationsEnabled,
  getRandomWindowEnd,
  getRandomWindowEndMinute,
  getRandomWindowStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
  type NotificationMode,
} from "../notifications/notification-preferences";

type Snapshot = Record<string, string | boolean | null>;

export interface SettingsPreferences {
  loading: boolean;
  enabled: boolean;
  mode: NotificationMode;
  windowStartHour: string;
  windowStartMinute: string;
  windowEndHour: string;
  windowEndMinute: string;
  scheduledHour: string;
  scheduledMinute: string;
  meditationDuration: number;
  snapshotRef: React.MutableRefObject<Snapshot>;
  initialLoadDone: React.MutableRefObject<boolean>;
  isDirty: boolean;
  setEnabled: (v: boolean) => void;
  setMode: (v: NotificationMode) => void;
  setWindowStartHour: (v: string) => void;
  setWindowStartMinute: (v: string) => void;
  setWindowEndHour: (v: string) => void;
  setWindowEndMinute: (v: string) => void;
  setScheduledHour: (v: string) => void;
  setScheduledMinute: (v: string) => void;
  setMeditationDuration: (v: number) => void;
  setIsDirty: (v: boolean) => void;
}

export function useSettingsPreferences(): SettingsPreferences {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<NotificationMode>("random");
  const [windowStartHour, setWindowStartHour] = useState("9");
  const [windowStartMinute, setWindowStartMinute] = useState("0");
  const [windowEndHour, setWindowEndHour] = useState("19");
  const [windowEndMinute, setWindowEndMinute] = useState("0");
  const [scheduledHour, setScheduledHour] = useState("9");
  const [scheduledMinute, setScheduledMinute] = useState("0");
  const [meditationDuration, setMeditationDuration] = useState(60000);
  const [isDirty, setIsDirty] = useState(false);
  const snapshotRef = useRef<Snapshot>({});
  const initialLoadDone = useRef(false);

  const load = useCallback(async () => {
    const isEnabled = await getNotificationsEnabled();
    setEnabled(isEnabled);
    const currentMode = await getNotificationMode();
    setMode(currentMode);
    setWindowStartHour((await getRandomWindowStart()).toString());
    setWindowStartMinute((await getRandomWindowStartMinute()).toString());
    setWindowEndHour((await getRandomWindowEnd()).toString());
    setWindowEndMinute((await getRandomWindowEndMinute()).toString());
    setScheduledHour((await getScheduledTimeHour()).toString());
    setScheduledMinute((await getScheduledTimeMinute()).toString());

    const durMs = await getMeditationDuration();
    setMeditationDuration(durMs);

    snapshotRef.current = {
      enabled: isEnabled,
      mode: currentMode,
      windowStartHour: (await getRandomWindowStart()).toString(),
      windowStartMinute: (await getRandomWindowStartMinute()).toString(),
      windowEndHour: (await getRandomWindowEnd()).toString(),
      windowEndMinute: (await getRandomWindowEndMinute()).toString(),
      scheduledHour: (await getScheduledTimeHour()).toString(),
      scheduledMinute: (await getScheduledTimeMinute()).toString(),
      meditationDuration: durMs.toString(),
    };
    initialLoadDone.current = true;
    setIsDirty(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    const s = snapshotRef.current;
    const changed =
      s.enabled !== enabled ||
      s.mode !== mode ||
      s.windowStartHour !== windowStartHour ||
      s.windowStartMinute !== windowStartMinute ||
      s.windowEndHour !== windowEndHour ||
      s.windowEndMinute !== windowEndMinute ||
      s.scheduledHour !== scheduledHour ||
      s.scheduledMinute !== scheduledMinute ||
      s.meditationDuration !== meditationDuration.toString();
    setIsDirty(changed);
  }, [
    enabled,
    mode,
    windowStartHour,
    windowStartMinute,
    windowEndHour,
    windowEndMinute,
    scheduledHour,
    scheduledMinute,
    meditationDuration,
  ]);

  return {
    loading,
    enabled,
    mode,
    windowStartHour,
    windowStartMinute,
    windowEndHour,
    windowEndMinute,
    scheduledHour,
    scheduledMinute,
    meditationDuration,
    isDirty,
    snapshotRef,
    initialLoadDone,
    setEnabled,
    setMode,
    setWindowStartHour,
    setWindowStartMinute,
    setWindowEndHour,
    setWindowEndMinute,
    setScheduledHour,
    setScheduledMinute,
    setMeditationDuration,
    setIsDirty,
  };
}