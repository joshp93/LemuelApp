import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { completeNewPassword, getAuthenticatedUser } from "../src/api/auth";
import { useAuth } from "../src/auth/auth-context";
import { LemuelButton } from "../src/components/lemuel-button";
import { LemuelKeyboardAvoidingView } from "../src/components/lemuel-keyboard-avoiding-view";
import { CONTENT_COLUMN, CONTENT_INSET } from "../src/constants/layout";
import { buildRedirectResetAction } from "../src/utils/auth-redirect";
import { getPasswordError } from "../src/utils/password";

/**
 * Lets a user whose password was reset by an administrator choose a new one.
 *
 * Cognito answers the sign-in attempt with a `NEW_PASSWORD_REQUIRED` challenge
 * and a session; the screen sends the new password back with that session and,
 * on success, continues to the page the user originally asked for.
 */
export default function NewPassword() {
  const router = useRouter();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const params = useLocalSearchParams<{
    email?: string;
    session?: string;
    redirect?: string;
    route?: string;
  }>();
  const email = params.email || "";
  const session = params.session || "";
  const redirect = params.redirect;
  const route = params.route;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setError("");

    if (!email || !session) {
      setError("This page has expired. Request a reset code to continue.");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await completeNewPassword(email, session, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Could not set the new password.");
      return;
    }

    await refreshUser();
    const authenticatedUser = await getAuthenticatedUser();
    navigation.dispatch(
      buildRedirectResetAction(
        route || "index",
        redirect || "/",
        authenticatedUser?.userId ?? "",
      ),
    );
  };

  const handleRequestReset = () => {
    router.replace({
      pathname: "/forgot-password",
      params: { email },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Choose a new password" }} />
      <LemuelKeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <View style={[styles.container, CONTENT_COLUMN]}>
            <Text style={styles.title}>Choose a new password</Text>
            <Text style={styles.subtitle}>
              Your password has been reset. Please choose a new one.
            </Text>
            <Text style={styles.emailPreview}>{email}</Text>

            {error ? <Text style={styles.formError}>{error}</Text> : null}

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="New password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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

            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <LemuelButton onPress={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Set password"}
            </LemuelButton>

            <Pressable style={styles.backButton} onPress={handleRequestReset}>
              <Text style={styles.backButtonText}>Request a reset code</Text>
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
    padding: CONTENT_INSET,
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
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
  },
  emailPreview: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  formError: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
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
