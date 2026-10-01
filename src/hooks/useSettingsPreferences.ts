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
import {
  getEnabledMeditationShaders,
  getMeditationDuration,
} from "../settings/meditation-preferences";
import {
  BLANK_SHADER_ID,
  DEFAULT_ENABLED_SHADER_IDS,
  DEFAULT_SHADER_ID,
  type MeditationShaderId,
} from "../utils/meditation-shaders";

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
  enabledShaders: MeditationShaderId[];
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
  toggleShader: (id: MeditationShaderId) => void;
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
  enabledShaders: MeditationShaderId[];
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
  enabledShaders: MeditationShaderId[];
  saved: Saved;
  isDirty: boolean;
};

type Action =
  | { type: "LOADED"; payload: Omit<State, "loading" | "saved" | "isDirty"> }
  | { type: "SET"; field: "enabled"; value: boolean }
  | { type: "SET"; field: "mode"; value: NotificationMode }
  | { type: "SET"; field: "meditationDuration"; value: number }
  | {
      type: "SET";
      field:
        | "windowStartHour"
        | "windowStartMinute"
        | "windowEndHour"
        | "windowEndMinute"
        | "scheduledHour"
        | "scheduledMinute";
      value: string;
    }
  | { type: "TOGGLE_SHADER"; id: MeditationShaderId }
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
  enabledShaders: [DEFAULT_SHADER_ID],
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
  enabledShaders: [DEFAULT_SHADER_ID],
  saved: initialSaved,
  isDirty: false,
};

/**
 * Renders an order-insensitive key for a shader selection, so it can be compared
 * for dirtiness and stored in the string-valued snapshot.
 *
 * @param ids - The selected shader ids.
 * @returns A stable string key.
 */
export function shaderSelectionKey(ids: readonly MeditationShaderId[]): string {
  return [...ids].sort().join(",");
}

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
          enabledShaders: action.payload.enabledShaders,
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
        s.meditationDuration !== next.meditationDuration ||
        shaderSelectionKey(s.enabledShaders) !==
          shaderSelectionKey(next.enabledShaders);
      return next;
    }
    case "TOGGLE_SHADER": {
      const selected = state.enabledShaders.includes(action.id);
      let enabledShaders: MeditationShaderId[];

      if (action.id === BLANK_SHADER_ID) {
        enabledShaders = selected
          ? state.enabledShaders.filter((id) => id !== BLANK_SHADER_ID)
          : [...state.enabledShaders, BLANK_SHADER_ID];
        if (enabledShaders.length === 0) {
          enabledShaders = [...DEFAULT_ENABLED_SHADER_IDS];
        }
      } else {
        enabledShaders = selected
          ? state.enabledShaders.filter((id) => id !== action.id)
          : [...state.enabledShaders, action.id];
        if (
          enabledShaders.filter((id) => id !== BLANK_SHADER_ID).length === 0
        ) {
          return state;
        }
      }

      return {
        ...state,
        enabledShaders,
        isDirty:
          shaderSelectionKey(state.saved.enabledShaders) !==
          shaderSelectionKey(enabledShaders),
      };
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
          enabledShaders: state.enabledShaders,
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
      const shaders = await getEnabledMeditationShaders();

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
        enabledShaders: shaderSelectionKey(shaders),
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
          enabledShaders: shaders,
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
    (v: string) =>
      dispatch({ type: "SET", field: "windowStartHour", value: v }),
    [],
  );
  const setWindowStartMinute = useCallback(
    (v: string) =>
      dispatch({ type: "SET", field: "windowStartMinute", value: v }),
    [],
  );
  const setWindowEndHour = useCallback(
    (v: string) => dispatch({ type: "SET", field: "windowEndHour", value: v }),
    [],
  );
  const setWindowEndMinute = useCallback(
    (v: string) =>
      dispatch({ type: "SET", field: "windowEndMinute", value: v }),
    [],
  );
  const setScheduledHour = useCallback(
    (v: string) => dispatch({ type: "SET", field: "scheduledHour", value: v }),
    [],
  );
  const setScheduledMinute = useCallback(
    (v: string) =>
      dispatch({ type: "SET", field: "scheduledMinute", value: v }),
    [],
  );
  const setMeditationDuration = useCallback(
    (v: number) =>
      dispatch({ type: "SET", field: "meditationDuration", value: v }),
    [],
  );
  const toggleShader = useCallback(
    (id: MeditationShaderId) => dispatch({ type: "TOGGLE_SHADER", id }),
    [],
  );
  const setIsDirty = useCallback((v: boolean) => {
    if (!v) dispatch({ type: "SYNC_SNAPSHOT" });
  }, []);

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
    enabledShaders: state.enabledShaders,
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
    toggleShader,
    setIsDirty,
  };
}
