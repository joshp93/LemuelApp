import { Stack } from "expo-router";
import { useEffect } from "react";
import { ScrollView } from "react-native";
import { ProverbCard } from "../src/components/proverb-card";
import { Text } from "../src/components/themed-text";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";
import { updateProverbWidget } from "../src/widgets";

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
          title: proverb && !loading && !error ? proverb.ref : "Daily Proverb",
        }}
      />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
        }}
        style={{
          flex: 1,
          backgroundColor: "#E6F4FE",
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
      </ScrollView>
    </>
  );
}
