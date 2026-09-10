import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

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
          date: formatDate(item.date),
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

  const trimmedQuery = query.trim().toLowerCase();
  const filteredNotes = trimmedQuery
    ? notes.filter(
        (n) =>
          n.date.toLowerCase().includes(trimmedQuery) ||
          n.displayRef.toLowerCase().includes(trimmedQuery) ||
          n.ref.toLowerCase().includes(trimmedQuery),
      )
    : notes;

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
            contentInsetAdjustmentBehavior="automatic"
            data={filteredNotes}
            keyExtractor={(item) => item.ref}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <View style={styles.searchContainer}>
                  {searchOpen ? (
                    <View style={styles.searchBox}>
                      <MaterialIcons
                        name="search"
                        size={20}
                        color="#999"
                        style={styles.searchIconInside}
                      />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search by date or proverb"
                        placeholderTextColor="#999"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (query.length > 0) {
                            setQuery("");
                          } else {
                            setSearchOpen(false);
                          }
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        testID="close-search"
                      >
                        <MaterialIcons name="close" size={20} color="#999" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.searchIconButton}
                      onPress={() => setSearchOpen(true)}
                      testID="open-search"
                    >
                      <MaterialIcons name="search" size={24} color="#333" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.headerRow}>
                  <Text style={styles.headerCell}>Daily proverb date</Text>
                  <Text style={[styles.headerCell, styles.headerCellRight]}>
                    Proverb
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              trimmedQuery ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>No matches found</Text>
                </View>
              ) : null
            }
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
    </KeyboardAvoidingView>
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
  searchContainer: {
    marginBottom: 8,
  },
  searchIconButton: {
    alignSelf: "flex-start",
    padding: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIconInside: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 0,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingVertical: 8,
    marginBottom: 4,
    alignItems: "center",
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
    marginRight: 8,
  },
  headerCellRight: {
    textAlign: "right",
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
