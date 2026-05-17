import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { resendVerificationCode, verifyAccount } from "../src/api/auth";

export default function ConfirmSignUp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [fieldError, setFieldError] = useState<string>();

  const handleConfirm = async () => {
    setFormError("");
    setFieldError(undefined);

    if (!code) {
      setFieldError("Verification code is required");
      return;
    }

    if (code.length !== 6) {
      setFieldError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    const result = await verifyAccount(email, code);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("Your email has been verified. You can now sign in.");
      setTimeout(
        () => router.push({ pathname: "/sign-in", params: { email } }),
        2000,
      );
    } else {
      setFormError(result.message || "Verification failed. Please try again.");
    }
  };

  const handleResend = async () => {
    setFormError("");
    setResendMessage("");
    setResending(true);
    const result = await resendVerificationCode(email);
    setResending(false);
    if (result.success) {
      setResendMessage("Code resent! Check your email.");
    } else {
      setFormError(result.message || "Failed to resend code. Please try again.");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Confirm Sign Up" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Confirm Sign Up</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your email
        </Text>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        {successMessage ? (
          <Text style={styles.success}>{successMessage}</Text>
        ) : null}

        <Text style={styles.emailPreview}>{email}</Text>

        <TextInput
          style={[styles.input, fieldError ? styles.inputError : null]}
          placeholder="Verification Code"
          value={code}
          onChangeText={setCode}
          onBlur={() => {
            if (!code) setFieldError("Verification code is required");
          }}
          keyboardType="number-pad"
          maxLength={6}
        />
        {fieldError ? (
          <Text style={styles.fieldError}>{fieldError}</Text>
        ) : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </Pressable>

        {resendMessage ? (
          <Text style={styles.resendMessage}>{resendMessage}</Text>
        ) : null}

        <Pressable
          style={[styles.resendButton, resending && styles.buttonDisabled]}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.resendButtonText}>
            {resending ? "Sending..." : "Resend Code"}
          </Text>
        </Pressable>
      </View>
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
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
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
  success: {
    color: "#28a745",
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
    textAlign: "center",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resendMessage: {
    color: "#28a745",
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
  },
  resendButton: {
    marginTop: 15,
    padding: 10,
  },
  resendButtonText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
  },
});
