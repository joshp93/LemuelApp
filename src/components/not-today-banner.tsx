import { View } from "react-native";
import { formatDate } from "../utils/date";
import { DividingLine } from "./dividing-line";
import { LemuelButton } from "./lemuel-button";
import { Text } from "./themed-text";

export interface NotTodayBannerProps {
  date: string;
  onPressReturnToToday: () => void;
}

export function NotTodayBanner({
  date,
  onPressReturnToToday,
}: NotTodayBannerProps) {
  return (
    <View>
      <View
        style={{
          backgroundColor: "#E6F4FE",
          borderRadius: 8,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text style={{ color: "#333", fontSize: 14, flex: 1 }}>
          You are viewing the daily proverb for {formatDate(`${date}T00:00:00`)}
        </Text>
        <LemuelButton
          size="sm"
          style={{ flexShrink: 0 }}
          onPress={onPressReturnToToday}
        >
          Return to today
        </LemuelButton>
      </View>
      <DividingLine />
    </View>
  );
}
