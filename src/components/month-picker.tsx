import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getDailyProverbsForMonth } from "../api/daily-proverbs";
import { pad } from "../utils/format";
import { convertProverbKeyToDisplayProverb } from "../utils/proverb-helper";
import { Text } from "./themed-text";

interface MonthPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDay: (dateString: string) => void;
  initialMonth: string;
}

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthPicker({
  visible,
  onClose,
  onSelectDay,
  initialMonth,
}: MonthPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [availableDays, setAvailableDays] = useState<Map<string, string>>(
    new Map(),
  );
  const [loadingDays, setLoadingDays] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCurrentMonth(initialMonth);
    setSelectedDay(null);
  }, [visible, initialMonth]);

  useEffect(() => {
    if (!visible) return;
    setLoadingDays(true);
    getDailyProverbsForMonth(currentMonth)
      .then((items) =>
        setAvailableDays(new Map(items.map((d) => [d.sk, d.ref]))),
      )
      .catch(() => setAvailableDays(new Map()))
      .finally(() => setLoadingDays(false));
  }, [currentMonth, visible]);

  const goToPrevMonth = useCallback(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    setSelectedDay(null);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    setSelectedDay(null);
  }, [currentMonth]);

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  const selectedProverbRef = useMemo(() => {
    if (!selectedDay) return null;
    const ref = availableDays.get(selectedDay);
    return ref ? convertProverbKeyToDisplayProverb(ref) : null;
  }, [selectedDay, availableDays]);

  const days = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const startDay = new Date(y, m - 1, 1).getDay();
    const result: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [currentMonth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.arrowBtn}>
              <MaterialIcons name="chevron-left" size={28} color="black" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.arrowBtn}>
              <MaterialIcons name="chevron-right" size={28} color="black" />
            </TouchableOpacity>
          </View>

          {loadingDays && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#333" />
            </View>
          )}

          <View style={[styles.grid, loadingDays && { opacity: 0.3 }]}>
            <View style={styles.weekRow}>
              {DAY_NAMES.map((name, i) => (
                <View key={`${name}-${i}`} style={styles.dayCell}>
                  <Text style={styles.dayHeaderText}>{name}</Text>
                </View>
              ))}
            </View>
            {Array.from({ length: days.length / 7 }, (_, rowIdx) => (
              <View key={rowIdx} style={styles.weekRow}>
                {days.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                  if (day === null) {
                    return (
                      <View
                        key={`e-${rowIdx}-${colIdx}`}
                        style={styles.dayCell}
                      />
                    );
                  }
                  const dateStr = `${currentMonth}-${pad(day)}`;
                  const enabled = availableDays.has(dateStr);
                  const dayRef = availableDays.get(dateStr);
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={styles.dayCell}
                      disabled={!enabled}
                      onPress={() => setSelectedDay(dateStr)}
                    >
                      <View
                        style={[
                          styles.dayInner,
                          !enabled && styles.dayDisabled,
                          selectedDay === dateStr && styles.daySelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            !enabled && styles.dayTextDisabled,
                            selectedDay === dateStr && styles.dayTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.selectedRefRow}>
            <Text style={styles.selectedRefText}>
              {selectedProverbRef ?? ""}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !selectedDay && styles.confirmBtnDisabled,
            ]}
            disabled={!selectedDay}
            onPress={() => selectedDay && onSelectDay(selectedDay)}
          >
            <Text style={styles.confirmText}>Go</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: 300,
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  arrowBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: "center",
  },
  grid: {
    gap: 4,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dayCell: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 15,
    color: "#000",
  },
  dayTextDisabled: {
    color: "#999",
  },
  daySelected: {
    backgroundColor: "#333",
  },
  dayTextSelected: {
    color: "#fff",
  },
  selectedRefRow: {
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  selectedRefText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  confirmBtn: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
