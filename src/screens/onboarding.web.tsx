import { Redirect } from "expo-router";

/**
 * Onboarding is native-only. On the web, visiting the route returns home.
 *
 * @returns A redirect to the home screen.
 */
export default function WebOnboardingScreen() {
  return <Redirect href="/" />;
}
