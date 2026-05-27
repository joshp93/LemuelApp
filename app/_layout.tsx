import "react-native-get-random-values";

import {
  Nunito_400Regular,
  Nunito_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { AuthProvider } from "../src/auth/auth-context";
import {
  defineBackgroundTask,
  initializeBackgroundTask,
} from "../src/background/proverb-task";
import { HeaderMenu } from "../src/components/header-menu";
import { initializeNotifications } from "../src/notifications/daily-proverb-notification";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_400Regular_Italic,
  });

  useEffect(() => {
    defineBackgroundTask();
    initializeBackgroundTask();
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={styles.container}
      enabled
    >
      <Stack
        screenOptions={{
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
        <Stack.Screen name="notifications" />
      </Stack>
    </KeyboardAvoidingView>
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
    backgroundColor: "#E6F4FE",
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
