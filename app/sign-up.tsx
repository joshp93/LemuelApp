import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createAccount } from "../src/api/auth";
import { LemuelButton } from "../src/components/lemuel-button";
import { isValidEmail } from "../src/utils/email";
import { getPasswordError } from "../src/utils/password";

export default function SignUp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateField = (
    field: "email" | "password" | "confirmPassword",
    value: string,
    allValues?: { password: string; confirmPassword: string },
  ) => {
    let error: string | undefined;

    if (!value) {
      error = `${field === "confirmPassword" ? "Confirm password" : field === "email" ? "Email" : "Password"} is required`;
    } else if (field === "email" && !isValidEmail(value)) {
      error = "Please enter a valid email address";
    } else if (field === "password") {
      error = getPasswordError(value) || undefined;
    } else if (
      field === "confirmPassword" &&
      allValues &&
      value !== allValues.password
    ) {
      error = "Passwords do not match";
    }

    setFieldErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleSignUp = async () => {
    setFormError("");
    setSuccessMessage("");

    const emailValid = validateField("email", email);
    const passwordValid = validateField("password", password);
    const confirmValid = validateField("confirmPassword", confirmPassword, {
      password,
      confirmPassword,
    });

    if (!emailValid || !passwordValid || !confirmValid) {
      return;
    }

    setLoading(true);
    const result = await createAccount(email, password);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("Check your email for a verification code");
      router.replace({
        pathname: "/confirm-sign-up",
        params: { email },
      });
    } else {
      setFormError(result.message || "Sign up failed. Please try again.");
    }
  };

  const handleBack = () => {
    router.replace("/email-entry");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Sign Up" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Sign Up</Text>

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          {successMessage ? (
            <Text style={styles.success}>{successMessage}</Text>
          ) : null}

          <TextInput
            style={[styles.input, fieldErrors.email ? styles.inputError : null]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => validateField("email", email)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {fieldErrors.email ? (
            <Text style={styles.fieldError}>{fieldErrors.email}</Text>
          ) : null}

          <TextInput
            style={[
              styles.input,
              fieldErrors.password ? styles.inputError : null,
            ]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => validateField("password", password)}
            secureTextEntry={!showPassword}
          />
          {fieldErrors.password ? (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          ) : null}

          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                fieldErrors.confirmPassword ? styles.inputError : null,
              ]}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() =>
                validateField("confirmPassword", confirmPassword, {
                  password,
                  confirmPassword,
                })
              }
              secureTextEntry={!showPassword}
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
          {fieldErrors.confirmPassword ? (
            <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
          ) : null}

          <LemuelButton onPress={handleSignUp} disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </LemuelButton>

          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back to Email</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 30,
    color: "#333",
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
