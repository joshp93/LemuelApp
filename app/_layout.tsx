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
import { Alert, Image, StyleSheet, View } from "react-native";
import { registerPushToken } from "../src/api/push-token";
import { AuthProvider } from "../src/auth/auth-context";
import { HeaderMenu } from "../src/components/header-menu";
import { COLORS } from "../src/constants/theme";
import { initializeNotifications } from "../src/notifications/daily-proverb-notification";
import {
  initializePushHandler,
  setupTokenListener,
} from "../src/notifications/push-listener";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_400Regular_Italic,
  });

  const router = useRouter();

  useEffect(() => {
    initializePushHandler();
    initializeNotifications();
    registerPushToken();
    const subscription = setupTokenListener();
    return () => subscription.remove();
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
            <HeaderMenu>
              <Image
                source={require("../assets/images/app-logo.png")}
                style={{ width: 40, height: 40, resizeMode: "contain" }}
              />
            </HeaderMenu>
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
  defaultText: {
    fontFamily: "Nunito_400Regular",
  },
});
