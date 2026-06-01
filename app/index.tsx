import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, Pressable, ScrollView, View, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProverbCard } from "../src/components/proverb-card";
import { Text } from "../src/components/themed-text";
import { VersionDropdown } from "../src/components/version-dropdown";
import { useFitProverbFontSize } from "../src/hooks/useFitProverbFontSize";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";
import { updateProverbWidget } from "../src/widgets";

const BTN_BLOCK = 85;

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: windowHeight } = useWindowDimensions();

  const {
    proverb,
    loading,
    error,
    selectedVersion,
    availableVersions,
    changeVersion,
  } = useProverbForTheDay();

  useEffect(() => {
    if (proverb) {
      updateProverbWidget(proverb);
    }
  }, [proverb]);

  const headerHeight = insets.top + (Platform.OS === "ios" ? 44 : 56);
  const textBoxWidth = screenWidth - 64;
  const textBoxHeight = windowHeight - headerHeight - BTN_BLOCK - 64;

  const { fontSize, overflowsAtMin } = useFitProverbFontSize(
    proverb?.proverb,
    textBoxWidth,
    textBoxHeight,
    { minSize: 20, maxSize: 56 },
  );

  const title = proverb && !loading && !error ? proverb.ref : "Daily Proverb";

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontFamily: "Nunito_400Regular",
                }}
              >
                {title}
              </Text>
              {availableVersions &&
                availableVersions.length > 0 &&
                selectedVersion && (
                  <VersionDropdown
                    versions={availableVersions}
                    selectedVersion={selectedVersion}
                    onSelect={changeVersion}
                  />
                )}
            </View>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
        }}
        style={{
          flex: 1,
          backgroundColor: "#E6F4FE",
        }}
        scrollEnabled={overflowsAtMin}
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
        <View style={overflowsAtMin ? undefined : { flex: 1, justifyContent: "flex-start" }}>
          {proverb && !loading && !error && (
            <ProverbCard proverb={proverb} fontSize={fontSize} />
          )}
        </View>
      </ScrollView>
      <Pressable
        style={styles.meditationButton}
        onPress={() => router.push("/meditation")}
      >
        <Text style={styles.meditationButtonText}>Start Meditation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  meditationButton: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 36,
  },
  meditationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Nunito_400Regular",
  },
});