import { Stack } from "expo-router";
import { View } from "react-native";
import { useEffect } from "react";
import { Text } from "./components/themed-text";
import { ProverbCard } from "./components/proverb-card";
import { useProverbForTheDay } from "./hooks/useProverbForTheDay";
import { updateProverbWidget } from "./widgets";

export default function Index() {
  const { proverb, loading, error } = useProverbForTheDay();

  useEffect(() => {
    if (proverb) {
      updateProverbWidget(proverb);
    }
  }, [proverb]);

  return (
    <>
      <Stack.Screen
        options={{
          title:
            proverb && !loading && !error ? proverb.ref : "Proverb of the Day",
        }}
      />
      <View
        style={{
          flex: 1,
          padding: 16,
          overflowY: "auto",
        }}
      >
        {loading && (
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Loading proverb...
          </Text>
        )}
        {error && <Text>{error}</Text>}
        {proverb && !loading && !error && <ProverbCard proverb={proverb} />}
      </View>
    </>
  );
}
