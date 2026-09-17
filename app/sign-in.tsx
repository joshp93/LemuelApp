import * as Notifications from "expo-notifications";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { CommonActions } from "expo-router/build/react-navigation";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAccountRecord, linkDeviceToken } from "../src/api/account";
import { getAuthenticatedUser, signIn } from "../src/api/auth";
import { useAuth } from "../src/auth/auth-context";
import { LemuelButton } from "../src/components/lemuel-button";
import { LemuelKeyboardAvoidingView } from "../src/components/lemuel-keyboard-avoiding-view";

/**
 * Splits a redirect URL into its path part and search string.
 *
 * @example
 * splitRedirectUrl("/notes/users/{{uuid}}/Pro 3:5?date=2026-09-17")
 * // => { pathPart: "/notes/users/{{uuid}}/Pro 3:5", queryPart: "date=2026-09-17" }
 */
const splitRedirectUrl = (
  redirectUrl: string,
): {
  pathPart: string;
  queryPart: string | null;
} => {
  const idx = redirectUrl.indexOf("?");
  if (idx === -1) {
    return { pathPart: redirectUrl, queryPart: null };
  }
  return {
    pathPart: redirectUrl.slice(0, idx),
    queryPart: redirectUrl.slice(idx + 1),
  };
};

/**
 * Extracts dynamic route params from a resolved path by matching its segments
 * against a route template.
 *
 * Template segments in `[name]` brackets are matched by position against the
 * resolved path. The special `uuid` param is replaced with the authenticated
 * user's actual ID.
 *
 * @example
 * extractRouteParamsFromPath(
 *   "notes/users/abc-123/Pro 3:5",
 *   "notes/users/[uuid]/[ref]",
 *   { userId: "abc-123" },
 * )
 * // => { uuid: "abc-123", ref: "Pro 3:5" }
 */
const extractRouteParamsFromPath = (
  resolvedPath: string,
  routeTemplate: string,
  authenticatedUserId: string,
): Record<string, string> => {
  const resolvedSegments = resolvedPath.replace(/^\//, "").split("/");
  const templateSegments = routeTemplate.split("/");
  const params: Record<string, string> = {};

  for (let i = 0; i < templateSegments.length; i++) {
    const bracketMatch = templateSegments[i].match(/^\[(.+)\]$/);
    if (bracketMatch) {
      const paramName = bracketMatch[1];
      const segmentValue = resolvedSegments[i] ?? "";
      params[paramName] =
        paramName === "uuid" ? authenticatedUserId : segmentValue;
    }
  }

  return params;
};

/**
 * Extracts query string parameters that are NOT consumed by the route template's
 * dynamic segments.
 *
 * @example
 * extractExtraQueryParams("date=2026-09-17&foo=bar", "notes/users/[uuid]/[ref]")
 * // => { date: "2026-09-17" }
 */
const extractExtraQueryParams = (
  queryPart: string | null,
  routeTemplate: string,
): Record<string, string> => {
  if (!queryPart) return {};

  const params: Record<string, string> = {};
  const templateParamNames = new Set(
    routeTemplate
      .split("/")
      .map((s) => s.match(/^\[(.+)\]$/)?.[1])
      .filter(Boolean),
  );

  for (const pair of queryPart.split("&")) {
    const [k, v] = pair.split("=");
    if (k && v !== undefined && !templateParamNames.has(k)) {
      params[k] = decodeURIComponent(v);
    }
  }

  return params;
};

/**
 * Builds a reset action that navigates to the route given by `routeName` with
 * params parsed from the redirect URL.
 *
 * The `redirect` URL may contain `{{uuid}}` placeholders which are replaced
 * with the authenticated user's actual ID. Path segments are matched against
 * `routeName`'s template brackets to extract dynamic params. Any query-string
 * params not consumed by the route template are forwarded as additional params.
 */
const buildRedirectResetAction = (
  routeName: string,
  redirectUrl: string,
  authenticatedUserId: string,
) => {
  const { pathPart, queryPart } = splitRedirectUrl(redirectUrl);
  const replacedPath = pathPart.replace("{{uuid}}", authenticatedUserId);
  const routeParams: Record<string, string> = {
    ...extractRouteParamsFromPath(replacedPath, routeName, authenticatedUserId),
    ...extractExtraQueryParams(queryPart, routeName),
  };
  const hasParams = Object.keys(routeParams).length > 0;
  const route = hasParams
    ? { name: routeName, params: routeParams }
    : { name: routeName };

  return CommonActions.reset({
    index: 0,
    routes: [route],
  });
};

export default function SignIn() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{
    email?: string;
    displayName?: string;
    redirect?: string;
    route?: string;
  }>();
  const { refreshUser } = useAuth();
  const email = params.email || "";
  const redirect = params.redirect;
  const route = params.route;
  const passwordRef = useRef<TextInput>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldError, setFieldError] = useState<string>();

  const handleSignIn = async () => {
    setFormError("");
    setFieldError(undefined);

    if (!password) {
      setFieldError("Password is required");
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      await refreshUser();
      const token = (await Notifications.getDevicePushTokenAsync()).data;
      if (params.displayName) {
        await createAccountRecord(params.displayName);
      }
      linkDeviceToken(token);
      const authenticatedUser = await getAuthenticatedUser();
      const routeName = route || "index";
      const redirectUrl = redirect || "/";
      navigation.dispatch(
        buildRedirectResetAction(
          routeName,
          redirectUrl,
          authenticatedUser?.userId ?? "",
        ),
      );
    } else if (result.requiresConfirmation) {
      // User account not confirmed yet, redirect to confirmation screen
      router.replace({
        pathname: "/confirm-sign-up",
        params: { email },
      });
    } else {
      setFormError(result.message || "Sign in failed. Please try again.");
    }
  };

  const handleBack = () => {
    router.replace("/email-entry");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Sign In" }} />
      <LemuelKeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        navigationSafeAutoFocus={passwordRef}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <View style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.emailPreview}>{email}</Text>

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}

            <View style={styles.passwordContainer}>
              <TextInput
                ref={passwordRef}
                style={[
                  styles.input,
                  styles.passwordInput,
                  fieldError ? styles.inputError : null,
                ]}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                onBlur={() => {
                  if (!password) setFieldError("Password is required");
                }}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
              <Pressable
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
            {fieldError ? (
              <Text style={styles.fieldError}>{fieldError}</Text>
            ) : null}

            <LemuelButton onPress={handleSignIn} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </LemuelButton>

            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back to Email</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LemuelKeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#E6F4FE",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  emailPreview: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  formError: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  fieldError: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 60,
  },
  showPasswordButton: {
    position: "absolute",
    right: 15,
    top: 0,
    bottom: 15,
    justifyContent: "center",
  },
  showPasswordText: {
    color: "#007AFF",
    fontSize: 16,
  },
  links: {
    marginTop: 20,
    alignItems: "center",
  },
  link: {
    color: "#007AFF",
    fontSize: 16,
  },
  backButton: {
    marginTop: 15,
    padding: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
});
