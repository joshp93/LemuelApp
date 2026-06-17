import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { NoteEntity } from "../../../src/api/notes";
import { getUserNotes } from "../../../src/api/notes";
import { remoteLog } from "../../../src/api/remote-logger";
import { type WithAuthProps, withAuth } from "../../../src/auth/with-auth";
import { formatDate } from "../../../src/utils/date";
import { convertProverbKeyToDisplayProverb } from "../../../src/utils/proverb-helper";

interface NoteRow {
  ref: string;
  displayRef: string;
  date: string;
  proverbDate: string;
}

function MyMeditationsPage(_props: WithAuthProps) {
  const router = useRouter();
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;
    remoteLog("debug", "[MyMeditations] Fetching notes", { uuid });
    setLoading(true);
    setError(null);
    getUserNotes(uuid)
      .then((data) => {
        remoteLog("info", "[MyMeditations] Notes fetched", {
          count: data.items.length,
        });
        const rows = data.items.map((item: NoteEntity) => ({
          ref: item.ref,
          displayRef: convertProverbKeyToDisplayProverb(item.ref),
          date: formatDate(item.dateCreated),
          proverbDate: item.date,
        }));
        setNotes(rows);
      })
      .catch((err) => {
        remoteLog("error", "[MyMeditations] Failed to fetch notes", {
          error: err,
        });
        setError(err instanceof Error ? err.message : "Failed to load notes");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [uuid]);

  const handlePress = useCallback(
    (ref: string, d: string) => {
      remoteLog("debug", "[MyMeditations] Navigating to note", {
        ref,
        date: d,
      });
      router.push(`/notes/users/${uuid}/${encodeURIComponent(ref)}?date=${d}`);
    },
    [uuid, router],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "My Meditations" }} />
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" testID="loading" />
        </View>
      )}
      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {!loading && !error && notes.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No meditations yet</Text>
        </View>
      )}
      {!loading && !error && notes.length > 0 && (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.ref}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handlePress(item.ref, item.proverbDate)}
            >
              <Text style={styles.dateCell}>{item.date}</Text>
              <Text style={styles.refCell}>{item.displayRef}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

export default withAuth(MyMeditationsPage);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  dateCell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  refCell: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    textAlign: "right",
  },
});
