import { useCallback, useEffect, useReducer } from "react";
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
import { toggleShaderSelection } from "../settings/shader-selection";
import {
  DEFAULT_SHADER_ID,
  type MeditationShaderId,
} from "../utils/meditation-shaders";

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
}

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
};

type Action =
  | { type: "LOADED"; payload: Omit<State, "loading"> }
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
  | { type: "TOGGLE_SHADER"; id: MeditationShaderId };

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
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return { ...state, ...action.payload, loading: false };
    case "SET":
      return { ...state, [action.field]: action.value };
    case "TOGGLE_SHADER": {
      const enabledShaders = toggleShaderSelection(
        state.enabledShaders,
        action.id,
      );
      return enabledShaders === state.enabledShaders
        ? state
        : { ...state, enabledShaders };
    }
  }
}

/**
 * Loads and edits the notification and meditation preferences stored on the
 * device.
 *
 * Every stored value is read in parallel, so the screen's loading state lasts
 * as long as the slowest read rather than the sum of all of them. Saving is the
 * caller's concern — the hook only owns the in-memory form state.
 *
 * @returns The current values and the setters that change them.
 */
export function useSettingsPreferences(): SettingsPreferences {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const [
        enabled,
        mode,
        windowStartHour,
        windowStartMinute,
        windowEndHour,
        windowEndMinute,
        scheduledHour,
        scheduledMinute,
        meditationDuration,
        enabledShaders,
      ] = await Promise.all([
        getNotificationsEnabled(),
        getNotificationMode(),
        getRandomWindowHourStart(),
        getRandomWindowStartMinute(),
        getRandomWindowHourEnd(),
        getRandomWindowEndMinute(),
        getScheduledTimeHour(),
        getScheduledTimeMinute(),
        getMeditationDuration(),
        getEnabledMeditationShaders(),
      ]);

      dispatch({
        type: "LOADED",
        payload: {
          enabled,
          mode,
          windowStartHour: windowStartHour.toString(),
          windowStartMinute: windowStartMinute.toString(),
          windowEndHour: windowEndHour.toString(),
          windowEndMinute: windowEndMinute.toString(),
          scheduledHour: scheduledHour.toString(),
          scheduledMinute: scheduledMinute.toString(),
          meditationDuration,
          enabledShaders,
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
  };
}
