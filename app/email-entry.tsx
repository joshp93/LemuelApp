import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkUserExists } from "../src/api/auth";
import { LemuelButton } from "../src/components/lemuel-button";
import { LemuelKeyboardAvoidingView } from "../src/components/lemuel-keyboard-avoiding-view";
import { isValidEmail } from "../src/utils/email";

export default function EmailEntry() {
  const router = useRouter();
  const { redirect, route } = useLocalSearchParams<{
    redirect?: string;
    route?: string;
  }>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const inputRef = useRef<TextInput>(null);

  const validateField = (value: string) => {
    if (!value) {
      setFieldError("Email is required");
      return false;
    }
    if (!isValidEmail(value)) {
      setFieldError("Please enter a valid email address");
      return false;
    }
    setFieldError(undefined);
    return true;
  };

  const handleContinue = async () => {
    if (!validateField(email)) {
      return;
    }

    setLoading(true);
    try {
      const userExists = await checkUserExists(email);
      if (userExists) {
        router.push({
          pathname: "/sign-in",
          params: {
            email,
            ...(redirect && { redirect }),
            ...(route && { route }),
          },
        });
      } else {
        router.push({
          pathname: "/sign-up",
          params: {
            email,
            ...(redirect && { redirect }),
            ...(route && { route }),
          },
        });
      }
    } catch {
      setFieldError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Welcome" }} />
      <LemuelKeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        navigationSafeAutoFocus={inputRef}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <View style={styles.container}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Enter your email to continue</Text>

            {fieldError ? (
              <Text style={styles.fieldError}>{fieldError}</Text>
            ) : null}

            <TextInput
              ref={inputRef}
              style={[styles.input, fieldError ? styles.inputError : null]}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase())}
              onBlur={() => validateField(email)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="go"
              onSubmitEditing={handleContinue}
            />

            <LemuelButton onPress={handleContinue} disabled={loading}>
              {loading ? "" : "Continue"}
            </LemuelButton>
            {loading && <ActivityIndicator style={styles.loader} />}
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
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
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
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  loader: {
    marginTop: 10,
  },
});
