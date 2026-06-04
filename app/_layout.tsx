import "react-native-get-random-values";

import {
  Nunito_400Regular,
  Nunito_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/nunito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { AuthProvider } from "../src/auth/auth-context";
import { initializeBackgroundTask } from "../src/background/proverb-task";
import { HeaderMenu } from "../src/components/header-menu";
import { initializeNotifications } from "../src/notifications/daily-proverb-notification";
import { COLORS } from "../src/constants/theme";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_400Regular_Italic,
  });

  const router = useRouter();

  useEffect(() => {
    initializeBackgroundTask();
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    (async () => {
      const shown = await AsyncStorage.getItem("notification_prompt_shown");
      if (!shown) {
        setTimeout(() => {
          Alert.alert(
            "Daily Proverb Reminders",
            "Would you like to receive a daily notification with the proverb of the day? You can adjust this anytime in Settings.",
            [
              { text: "Not Now", style: "cancel" },
              {
                text: "Go to Settings",
                onPress: () => router.push("/settings"),
              },
            ],
          );
        }, 1000);
        await AsyncStorage.setItem("notification_prompt_shown", "true");
      }
    })();
  }, [fontsLoaded, fontError, router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.lightBackground },
          headerTitleStyle: styles.defaultText,
          headerStyle: {
            backgroundColor: "black",
          },
          headerTintColor: "white",
          headerRight: () => (
            <View style={styles.headerLogoContainer}>
              <Image
                source={require("../assets/images/app-logo.png")}
                style={{ width: 40, height: 40, resizeMode: "contain" }}
              />
              <HeaderMenu />
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="email-entry" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="confirm-sign-up" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="meditation" />
        <Stack.Screen name="account" />
        <Stack.Screen name="notes/users/[uuid]/[ref]" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  headerLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 30,
    paddingHorizontal: 8,
    marginBottom: 2,
    height: 40,
  },
  defaultText: {
    fontFamily: "Nunito_400Regular",
  },
});