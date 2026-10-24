import "react-native-get-random-values";

import {
  Nunito_400Regular,
  Nunito_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerPushToken } from "../src/api/push-token";
import { AuthProvider } from "../src/auth/auth-context";
import { DialogHost } from "../src/components/dialog-host";
import { HeaderMenu } from "../src/components/header-menu";
import { CONTENT_INSET } from "../src/constants/layout";
import { COLORS } from "../src/constants/theme";
import { initializeNotifications } from "../src/notifications/daily-proverb-notification";
import {
  handleInitialNotificationResponse,
  subscribeToNotificationResponses,
} from "../src/notifications/notification-response";
import {
  ensureNotificationsScheduled,
  initializeBackgroundFetch,
  initializePushHandler,
  registerReplyNotificationCategory,
  setupTokenListener,
} from "../src/notifications/push-listener";
import { hasCompletedOnboarding } from "../src/onboarding/onboarding-storage";
import { getContentGutter } from "../src/utils/layout";
import { initializeWidget } from "../src/widgets/initializeWidget";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_400Regular_Italic,
  });

  const router = useRouter();
  const [startupReady, setStartupReady] = useState(Platform.OS === "web");
  const { width: windowWidth } = useWindowDimensions();
  const contentGutter = useMemo(
    () => (Platform.OS === "web" ? getContentGutter(windowWidth) : 0),
    [windowWidth],
  );

  const headerLogo = (
    <HeaderMenu>
      <Image
        source={require("../assets/images/app-logo.png")}
        style={{ width: 40, height: 40, resizeMode: "contain" }}
      />
    </HeaderMenu>
  );

  useEffect(() => {
    initializePushHandler();
    initializeNotifications();
    initializeBackgroundFetch();
    registerPushToken();
    ensureNotificationsScheduled(2);
    registerReplyNotificationCategory();

    const unsubscribe = subscribeToNotificationResponses(router);
    const tokenSub = setupTokenListener();
    return () => {
      tokenSub.remove();
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    initializeWidget();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || (!fontsLoaded && !fontError)) return;

    let active = true;

    hasCompletedOnboarding().then((completed) => {
      if (!active) return;
      if (!completed) {
        router.replace("/onboarding");
      }
      setStartupReady(true);
    });

    return () => {
      active = false;
    };
  }, [fontsLoaded, fontError, router]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && startupReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, startupReady]);

  useEffect(() => {
    if ((!fontsLoaded && !fontError) || !startupReady) return;

    handleInitialNotificationResponse(router);
  }, [fontsLoaded, fontError, startupReady, router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          contentStyle: styles.screenContent,
          headerTitleStyle: styles.defaultText,
          headerStyle: {
            backgroundColor: "black",
          },
          headerTintColor: "white",
          ...(contentGutter > 0 && {
            headerLeftContainerStyle: { paddingLeft: contentGutter },
          }),
          headerRight: () =>
            Platform.OS === "web" ? (
              <View style={{ paddingRight: contentGutter + CONTENT_INSET }}>
                {headerLogo}
              </View>
            ) : (
              headerLogo
            ),
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="email-entry" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="confirm-sign-up" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="new-password" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="meditation" />
        <Stack.Screen name="account" />
        <Stack.Screen name="notes/users/[uuid]/[ref]" />
      </Stack>
      <DialogHost />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  screenContent: {
    backgroundColor: COLORS.lightBackground,
  },
  defaultText: {
    fontFamily: "Nunito_400Regular",
  },
});
