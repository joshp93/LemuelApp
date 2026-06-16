import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { pad } from "../utils/format";

type TimePickerMode = "random" | "scheduled";

interface TimePickerProps {
  mode: TimePickerMode;
  hour: string;
  minute: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  endHour?: string;
  endMinute?: string;
  onEndHourChange?: (hour: string) => void;
  onEndMinuteChange?: (minute: string) => void;
}

export function TimePicker({
  mode,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  endHour,
  endMinute,
  onEndHourChange,
  onEndMinuteChange,
}: TimePickerProps) {
  const [picking, setPicking] = useState<"start" | "end" | null>(null);

  const getPickerDate = (): Date => {
    const d = new Date();
    if (picking === "start") {
      d.setHours(parseInt(hour, 10) || 9, parseInt(minute, 10) || 0, 0, 0);
    } else if (picking === "end") {
      d.setHours(
        parseInt(endHour ?? "19", 10) || 19,
        parseInt(endMinute ?? "0", 10) || 0,
        0,
        0,
      );
    }
    return d;
  };

  const handleValueChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setPicking(null);
    }
    if (!selectedDate) return;
    const hours = selectedDate.getHours().toString();
    const minutes = selectedDate.getMinutes().toString();
    if (picking === "start") {
      onHourChange(hours);
      onMinuteChange(minutes);
    } else if (picking === "end") {
      onEndHourChange?.(hours);
      onEndMinuteChange?.(minutes);
    }
  };

  const handleDismiss = () => {
    setPicking(null);
  };

  return (
    <View>
      <Text style={styles.timeFormatNote}>Times are in 24-hour format</Text>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>
          {mode === "random" ? "From:" : "Time:"}
        </Text>
        <TouchableOpacity
          style={styles.timeDisplay}
          onPress={() => setPicking("start")}
        >
          <Text style={styles.timeDisplayText}>
            {pad(parseInt(hour, 10))}:{pad(parseInt(minute, 10))}
          </Text>
        </TouchableOpacity>
        {mode === "random" && (
          <>
            <View style={styles.timeSpacer} />
            <Text style={styles.timeLabel}>To:</Text>
            <TouchableOpacity
              style={styles.timeDisplay}
              onPress={() => setPicking("end")}
            >
              <Text style={styles.timeDisplayText}>
                {pad(parseInt(endHour ?? "19", 10))}:
                {pad(parseInt(endMinute ?? "0", 10))}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {mode === "random" &&
        parseInt(hour, 10) * 60 + parseInt(minute, 10) >=
          parseInt(endHour ?? "19", 10) * 60 +
            parseInt(endMinute ?? "0", 10) && (
          <Text style={styles.validationText}>
            Start time must be before end time
          </Text>
        )}

      {picking && (
        <DateTimePicker
          value={getPickerDate()}
          mode="time"
          display="default"
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timeFormatNote: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    marginRight: 4,
  },
  timeDisplay: {
    backgroundColor: "#000",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: "center",
  },
  timeDisplayText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  timeSpacer: {
    width: 20,
  },
  validationText: {
    color: "#dc3545",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
});
