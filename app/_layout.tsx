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
  scheduleBackgroundTask,
} from "../src/background/proverb-task";
import { HeaderMenu } from "../src/components/header-menu";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_400Regular_Italic,
  });

  useEffect(() => {
    defineBackgroundTask();
    scheduleBackgroundTask();
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
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
      />
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
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
    height: 36,
  },
  defaultText: {
    fontFamily: "Nunito_400Regular",
  },
  defaultContent: {
    fontFamily: "Nunito_400Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6F4FE",
    padding: 20,
  },
  warningText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 16,
  },
  configText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
