import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAccount } from "../src/api/auth";
import { BottomSheetMenu } from "../src/components/bottom-sheet-menu";
import { LemuelButton } from "../src/components/lemuel-button";
import { isValidEmail } from "../src/utils/email";
import { getPasswordError } from "../src/utils/password";

function isValidDisplayName(value: string): string | undefined {
  if (!value) return "Display name is required";
  if (value.length < 3) return "Display name must be at least 3 characters";
  if (value.length > 50) return "Display name must be at most 50 characters";
  if (!/^[a-zA-Z0-9 _-]+$/.test(value))
    return "Display name can only contain letters, numbers, spaces, hyphens, and underscores";
  return undefined;
}

export default function SignUp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; redirect?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const redirect = params.redirect;
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    displayName?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateField = (
    field: "email" | "displayName" | "password" | "confirmPassword",
    value: string,
    allValues?: { password: string; confirmPassword: string },
  ) => {
    let error: string | undefined;

    if (!value) {
      error = `${field === "confirmPassword" ? "Confirm password" : field === "displayName" ? "Display name" : field === "email" ? "Email" : "Password"} is required`;
    } else if (field === "email" && !isValidEmail(value)) {
      error = "Please enter a valid email address";
    } else if (field === "displayName") {
      error = isValidDisplayName(value);
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
    const displayNameValid = validateField("displayName", displayName);
    const passwordValid = validateField("password", password);
    const confirmValid = validateField("confirmPassword", confirmPassword, {
      password,
      confirmPassword,
    });

    if (!emailValid || !displayNameValid || !passwordValid || !confirmValid) {
      return;
    }

    setLoading(true);
    const result = await createAccount(email, password);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("Check your email for a verification code");
      router.replace({
        pathname: "/confirm-sign-up",
        params: { email, displayName, ...(redirect && { redirect }) },
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
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}
            {successMessage ? (
              <Text style={styles.success}>{successMessage}</Text>
            ) : null}

            <TextInput
              style={[
                styles.input,
                fieldErrors.email ? styles.inputError : null,
              ]}
              placeholder="Email"
              placeholderTextColor="#999"
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

            <View style={styles.displayNameContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.displayNameInput,
                  fieldErrors.displayName ? styles.inputError : null,
                ]}
                placeholder="Display name"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
                onBlur={() => validateField("displayName", displayName)}
                autoCapitalize="none"
                autoComplete="username"
              />
              <Pressable
                style={styles.helpButton}
                onPress={() => setHelpVisible(true)}
                hitSlop={8}
              >
                <MaterialIcons name="help-outline" size={22} color="#007AFF" />
              </Pressable>
            </View>
            {fieldErrors.displayName ? (
              <Text style={styles.fieldError}>{fieldErrors.displayName}</Text>
            ) : null}

            <TextInput
              style={[
                styles.input,
                fieldErrors.password ? styles.inputError : null,
              ]}
              placeholder="Password"
              placeholderTextColor="#999"
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
                placeholderTextColor="#999"
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
              <Text style={styles.fieldError}>
                {fieldErrors.confirmPassword}
              </Text>
            ) : null}

            <LemuelButton onPress={handleSignUp} disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </LemuelButton>

            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back to Email</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <BottomSheetMenu
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        options={[
          {
            label:
              "Display name is the name which will appear next to your public notes and replies. It is required, but you don't need to use your real name if you don't want to. You can change this at any time from your account page.",
            onPress: () => setHelpVisible(false),
            align: "left",
          },
        ]}
      />
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
    color: "#333",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  displayNameContainer: {
    position: "relative",
  },
  displayNameInput: {
    paddingRight: 44,
  },
  helpButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 15,
    justifyContent: "center",
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
