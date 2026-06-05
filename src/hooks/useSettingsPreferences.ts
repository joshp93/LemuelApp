import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  getNotificationMode,
  getNotificationsEnabled,
  getRandomWindowEndMinute,
  getRandomWindowHourEnd,
  getRandomWindowHourStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
  type NotificationMode,
} from "../notifications/notification-preferences";
import { getMeditationDuration } from "../settings/meditation-preferences";

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

type Saved = {
  enabled: boolean;
  mode: NotificationMode;
  windowStartHour: string;
  windowStartMinute: string;
  windowEndHour: string;
  windowEndMinute: string;
  scheduledHour: string;
  scheduledMinute: string;
  meditationDuration: number;
};

type State = {
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
  saved: Saved;
  isDirty: boolean;
};

type Action =
  | { type: "LOADED"; payload: Omit<State, "loading" | "saved" | "isDirty"> }
  | { type: "SET"; field: "enabled"; value: boolean }
  | { type: "SET"; field: "mode"; value: NotificationMode }
  | { type: "SET"; field: "meditationDuration"; value: number }
  | { type: "SET"; field: "windowStartHour" | "windowStartMinute" | "windowEndHour" | "windowEndMinute" | "scheduledHour" | "scheduledMinute"; value: string }
  | { type: "SYNC_SNAPSHOT" };

const initialSaved: Saved = {
  enabled: false,
  mode: "random",
  windowStartHour: "9",
  windowStartMinute: "0",
  windowEndHour: "19",
  windowEndMinute: "0",
  scheduledHour: "9",
  scheduledMinute: "0",
  meditationDuration: 60000,
};

const initialState: State = {
  loading: true,
  enabled: false,
  mode: "random",
  windowStartHour: "9",
  windowStartMinute: "0",
  windowEndHour: "19",
  windowEndMinute: "0",
  scheduledHour: "9",
  scheduledMinute: "0",
  meditationDuration: 60000,
  saved: initialSaved,
  isDirty: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return {
        ...state,
        ...action.payload,
        loading: false,
        saved: {
          enabled: action.payload.enabled,
          mode: action.payload.mode,
          windowStartHour: action.payload.windowStartHour,
          windowStartMinute: action.payload.windowStartMinute,
          windowEndHour: action.payload.windowEndHour,
          windowEndMinute: action.payload.windowEndMinute,
          scheduledHour: action.payload.scheduledHour,
          scheduledMinute: action.payload.scheduledMinute,
          meditationDuration: action.payload.meditationDuration,
        },
        isDirty: false,
      };
    case "SET": {
      const next = { ...state, [action.field]: action.value };
      const s = state.saved;
      next.isDirty =
        s.enabled !== next.enabled ||
        s.mode !== next.mode ||
        s.windowStartHour !== next.windowStartHour ||
        s.windowStartMinute !== next.windowStartMinute ||
        s.windowEndHour !== next.windowEndHour ||
        s.windowEndMinute !== next.windowEndMinute ||
        s.scheduledHour !== next.scheduledHour ||
        s.scheduledMinute !== next.scheduledMinute ||
        s.meditationDuration !== next.meditationDuration;
      return next;
    }
    case "SYNC_SNAPSHOT":
      return {
        ...state,
        saved: {
          enabled: state.enabled,
          mode: state.mode,
          windowStartHour: state.windowStartHour,
          windowStartMinute: state.windowStartMinute,
          windowEndHour: state.windowEndHour,
          windowEndMinute: state.windowEndMinute,
          scheduledHour: state.scheduledHour,
          scheduledMinute: state.scheduledMinute,
          meditationDuration: state.meditationDuration,
        },
        isDirty: false,
      };
  }
}

export function useSettingsPreferences(): SettingsPreferences {
  const [state, dispatch] = useReducer(reducer, initialState);
  const snapshotRef = useRef<Snapshot>({});
  const initialLoadDone = useRef(false);

  useEffect(() => {
    (async () => {
      const isEnabled = await getNotificationsEnabled();
      const currentMode = await getNotificationMode();
      const startHour = (await getRandomWindowHourStart()).toString();
      const startMinute = (await getRandomWindowStartMinute()).toString();
      const endHour = (await getRandomWindowHourEnd()).toString();
      const endMinute = (await getRandomWindowEndMinute()).toString();
      const schedHour = (await getScheduledTimeHour()).toString();
      const schedMinute = (await getScheduledTimeMinute()).toString();
      const durMs = await getMeditationDuration();

      snapshotRef.current = {
        enabled: isEnabled,
        mode: currentMode,
        windowStartHour: startHour,
        windowStartMinute: startMinute,
        windowEndHour: endHour,
        windowEndMinute: endMinute,
        scheduledHour: schedHour,
        scheduledMinute: schedMinute,
        meditationDuration: durMs.toString(),
      };
      initialLoadDone.current = true;

      dispatch({
        type: "LOADED",
        payload: {
          enabled: isEnabled,
          mode: currentMode,
          windowStartHour: startHour,
          windowStartMinute: startMinute,
          windowEndHour: endHour,
          windowEndMinute: endMinute,
          scheduledHour: schedHour,
          scheduledMinute: schedMinute,
          meditationDuration: durMs,
        },
      });
    })();
  }, []);

  const setEnabled = useCallback(
    (v: boolean) => dispatch({ type: "SET", field: "enabled", value: v }),
    [],
  );
  const setMode = useCallback(
    (v: NotificationMode) => dispatch({ type: "SET", field: "mode", value: v }),
    [],
  );
  const setWindowStartHour = useCallback(
    (v: string) => dispatch({ type: "SET", field: "windowStartHour", value: v }),
    [],
  );
  const setWindowStartMinute = useCallback(
    (v: string) => dispatch({ type: "SET", field: "windowStartMinute", value: v }),
    [],
  );
  const setWindowEndHour = useCallback(
    (v: string) => dispatch({ type: "SET", field: "windowEndHour", value: v }),
    [],
  );
  const setWindowEndMinute = useCallback(
    (v: string) => dispatch({ type: "SET", field: "windowEndMinute", value: v }),
    [],
  );
  const setScheduledHour = useCallback(
    (v: string) => dispatch({ type: "SET", field: "scheduledHour", value: v }),
    [],
  );
  const setScheduledMinute = useCallback(
    (v: string) => dispatch({ type: "SET", field: "scheduledMinute", value: v }),
    [],
  );
  const setMeditationDuration = useCallback(
    (v: number) => dispatch({ type: "SET", field: "meditationDuration", value: v }),
    [],
  );
  const setIsDirty = useCallback(
    (v: boolean) => {
      if (!v) dispatch({ type: "SYNC_SNAPSHOT" });
    },
    [],
  );

  return {
    loading: state.loading,
    enabled: state.enabled,
    mode: state.mode,
    windowStartHour: state.windowStartHour,
    windowStartMinute: state.windowStartMinute,
    windowEndHour: state.windowEndHour,
    windowEndMinute: state.windowEndMinute,
    scheduledHour: state.scheduledHour,
    scheduledMinute: state.scheduledMinute,
    meditationDuration: state.meditationDuration,
    isDirty: state.isDirty,
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