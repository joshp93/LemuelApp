import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { signIn } from "../src/api/auth";
import { useAuth } from "../src/auth/auth-context";

export default function SignIn() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { refreshUser } = useAuth();
  const email = params.email || "";
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
      router.replace("/");
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

  return (
    <>
      <Stack.Screen options={{ title: "Sign In" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.emailPreview}>{email}</Text>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              fieldError ? styles.inputError : null,
            ]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => {
              if (!password) setFieldError("Password is required");
            }}
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
        {fieldError ? (
          <Text style={styles.fieldError}>{fieldError}</Text>
        ) : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
<Text style={styles.buttonText}>
            {loading ? "Signing in..." : "Sign In"}
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
  links: {
    marginTop: 20,
    alignItems: "center",
  },
  link: {
    color: "#007AFF",
    fontSize: 16,
  },
});
