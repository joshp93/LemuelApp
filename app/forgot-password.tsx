import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { confirmPasswordReset, requestPasswordReset } from "../src/api/auth";
import { LemuelButton } from "../src/components/lemuel-button";
import { LemuelKeyboardAvoidingView } from "../src/components/lemuel-keyboard-avoiding-view";
import { CONTENT_COLUMN, CONTENT_INSET } from "../src/constants/layout";
import { notify } from "../src/utils/dialog";
import { isValidEmail } from "../src/utils/email";
import { getPasswordError } from "../src/utils/password";

type Step = "request" | "confirm";

/**
 * Walks a signed-out user through requesting and confirming a password reset.
 *
 * The first step sends a reset code to the email address; the second accepts
 * that code together with the new password. The sign-in redirect parameters are
 * carried through so the user lands where they were originally headed.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    redirect?: string;
    route?: string;
  }>();
  const redirect = params.redirect;
  const route = params.route;
  const [email, setEmail] = useState(params.email || "");
  const [step, setStep] = useState<Step>("request");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const codeRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const signInParams = {
    email,
    ...(redirect && { redirect }),
    ...(route && { route }),
  };

  const handleRequestCode = async () => {
    setError("");
    setMessage("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email.trim().toLowerCase());
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Could not send the reset code.");
      return;
    }

    setStep("confirm");
    setMessage("Check your email for a reset code.");
    setTimeout(() => codeRef.current?.focus(), 300);
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
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
    const result = await confirmPasswordReset(
      email.trim().toLowerCase(),
      code,
      password,
    );
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Could not reset the password.");
      return;
    }

    await notify(
      "Password reset",
      "Your password has been reset. You can now sign in.",
    );
    router.replace({ pathname: "/sign-in", params: signInParams });
  };

  const handleBack = () => {
    router.replace({ pathname: "/sign-in", params: signInParams });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Forgot password" }} />
      <LemuelKeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <View style={[styles.container, CONTENT_COLUMN]}>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              {step === "request"
                ? "Enter your email and we will send you a reset code"
                : "Enter the code we sent you and choose a new password"}
            </Text>

            {error ? <Text style={styles.formError}>{error}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {step === "request" ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => setEmail(text.toLowerCase())}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="go"
                  onSubmitEditing={handleRequestCode}
                />

                <LemuelButton onPress={handleRequestCode} disabled={loading}>
                  {loading ? "Sending..." : "Send reset code"}
                </LemuelButton>
              </>
            ) : (
              <>
                <Text style={styles.emailPreview}>{email}</Text>

                <TextInput
                  ref={codeRef}
                  style={styles.input}
                  placeholder="Verification code"
                  placeholderTextColor="#999"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordRef}
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
                  onSubmitEditing={handleResetPassword}
                />

                <LemuelButton onPress={handleResetPassword} disabled={loading}>
                  {loading ? "Resetting..." : "Set new password"}
                </LemuelButton>

                <Pressable
                  style={styles.resendButton}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  <Text style={styles.resendButtonText}>Resend code</Text>
                </Pressable>
              </>
            )}

            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back to sign in</Text>
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
    marginBottom: 24,
  },
  emailPreview: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
  },
  formError: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    color: "#28a745",
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
  resendButton: {
    marginTop: 8,
    padding: 10,
    alignItems: "center",
  },
  resendButtonText: {
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
