import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getAccountDetails,
  type AccountDetails,
} from "../src/api/account";
import { withAuth, type WithAuthProps } from "../src/auth/with-auth";

/**
 * Account screen showing the authenticated user's profile details.
 * Redirects to the email-entry screen if the user is not signed in.
 * This redirect is handled by the withAuth HOC.
 */
function Account({ user }: WithAuthProps) {
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccountDetails(user.userId)
      .then((data) => {
        setAccount(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [user.userId]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Account" }} />
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#333" />
        ) : error ? (
          <Text selectable style={styles.error}>
            {error}
          </Text>
        ) : account ? (
          <View style={styles.card}>
            <Text selectable style={styles.label}>
              Email
            </Text>
            <Text selectable style={styles.value}>
              {user.email}
            </Text>

            <View style={styles.divider} />

            <Text selectable style={styles.label}>
              Account Created
            </Text>
            <Text selectable style={styles.value}>
              {formatDate(account.accountCreatedDate)}
            </Text>

            <View style={styles.divider} />

            <Text selectable style={styles.label}>
              Total Meditations
            </Text>
            <Text selectable style={styles.value}>
              {account.totalMeditations}
            </Text>

            <View style={styles.divider} />

            <Text selectable style={styles.label}>
              Total Notes
            </Text>
            <Text selectable style={styles.value}>
              {account.totalNotes}
            </Text>
          </View>
        ) : (
          <Text selectable style={styles.info}>
            Account record not found. It will be created on your next sign-in.
          </Text>
        )}
      </ScrollView>
    </>
  );
}

export default withAuth(Account);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F4FE",
  },
  content: {
    padding: 20,
    justifyContent: "center",
    flexGrow: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    borderCurve: "continuous",
  },
  label: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  error: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
  },
  info: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
