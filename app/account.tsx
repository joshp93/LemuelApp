import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  type AccountDetails,
  deleteAccount,
  getAccountDetails,
  upsertDisplayName,
} from "../src/api/account";
import { useAuth } from "../src/auth/auth-context";
import { type WithAuthProps, withAuth } from "../src/auth/with-auth";
import { LemuelButton } from "../src/components/lemuel-button";
import { formatDate } from "../src/utils/date";

function Account({ user }: WithAuthProps) {
  const { signOut } = useAuth();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [accountManagementExpanded, setAccountManagementExpanded] =
    useState(false);

  const loadAccount = () => {
    getAccountDetails(user.userId)
      .then((data) => {
        setAccount(data);
        setDisplayNameDraft(data?.displayName ?? "");
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAccount();
  }, [user.userId]);

  const handleSaveDisplayName = async () => {
    if (!displayNameDraft.trim() || displayNameDraft.length > 50) return;
    setSaving(true);
    setSaveError(null);
    const ok = await upsertDisplayName(user.userId, displayNameDraft.trim());
    setSaving(false);
    if (ok) {
      setEditingDisplayName(false);
      loadAccount();
    } else {
      setSaveError("Failed to save display name. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingDisplayName(false);
    setDisplayNameDraft(account?.displayName ?? "");
    setSaveError(null);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data, notes, and account information will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const ok = await deleteAccount(user.userId);
            setDeleting(false);
            if (ok) {
              signOut();
            } else {
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again.",
              );
            }
          },
        },
      ],
    );
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
              Display Name
            </Text>
            {editingDisplayName ? (
              <View>
                <TextInput
                  style={styles.editInput}
                  value={displayNameDraft}
                  onChangeText={setDisplayNameDraft}
                  autoCapitalize="none"
                  maxLength={50}
                />
                {saveError ? (
                  <Text style={styles.saveError}>{saveError}</Text>
                ) : null}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <Pressable
                    style={[styles.editButton, { backgroundColor: "#dc3545" }]}
                    onPress={handleSaveDisplayName}
                    disabled={saving || !displayNameDraft.trim()}
                  >
                    <Text style={styles.editButtonText}>
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.editButton, { backgroundColor: "black" }]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.editButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text selectable style={[styles.value, { flex: 1 }]}>
                  {account.displayName || "Set display name"}
                </Text>
                <LemuelButton
                  size="sm"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    padding: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setEditingDisplayName(true)}
                >
                  <MaterialIcons name="edit" size={16} color="white" />
                </LemuelButton>
              </View>
            )}

            <View style={styles.divider} />

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

        {!loading && (
          <View style={styles.accordionCard}>
            <Pressable
              style={styles.accordionHeader}
              onPress={() =>
                setAccountManagementExpanded(!accountManagementExpanded)
              }
            >
              <Text style={styles.label}>Account Management</Text>
              <MaterialIcons
                name={
                  accountManagementExpanded
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                size={24}
                color="#666"
              />
            </Pressable>
            {accountManagementExpanded && (
              <View style={styles.accordionContent}>
                <Pressable
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {deleting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.overlayText}>Deleting account...</Text>
        </View>
      )}
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
  editInput: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  saveError: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: 4,
  },
  accordionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 32,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    borderCurve: "continuous",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  overlayText: {
    color: "white",
    fontSize: 18,
    marginTop: 16,
    fontWeight: "500",
  },
});
