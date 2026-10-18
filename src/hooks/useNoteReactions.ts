import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteReaction,
  getReactions,
  type NoteEntity,
  putReaction,
} from "../api/notes";
import { remoteLog } from "../api/remote-logger";
import type { GetReactionsResponse } from "../models/reactions-and-replies";
import { moveReaction, reactionKey } from "../utils/reactions";

interface UseNoteReactionsOptions {
  /** The notes whose reactions are shown. */
  notes: NoteEntity[];
  /** The signed-in user's Cognito UUID, or null when signed out. */
  userId: string | null;
  /** False while the page behind the notes is still loading. */
  ready: boolean;
}

interface NoteReactions {
  /** Each note's reactions, keyed by {@linkcode reactionKey}. */
  reactionData: Record<string, GetReactionsResponse>;
  /**
   * Records a reaction on one note.
   *
   * The change is shown at once and the server is asked afterwards; a write
   * that fails puts the reaction back, and a write that succeeds re-reads the
   * note's reactions so the counts settle on the server's.
   */
  changeReaction: (note: NoteEntity, next: string | null) => void;
}

/**
 * Loads the reactions on a page of notes and keeps them up to date.
 *
 * The reactions for every note are fetched together, because the note list is
 * drawn in one pass and a request per card would arrive at different times.
 *
 * @param options - The notes, the reader, and whether the page has loaded.
 * @returns The reactions by note, and how to change one.
 */
export function useNoteReactions({
  notes,
  userId,
  ready,
}: UseNoteReactionsOptions): NoteReactions {
  const [reactionData, setReactionData] = useState<
    Record<string, GetReactionsResponse>
  >({});
  const reactionDataRef = useRef(reactionData);
  reactionDataRef.current = reactionData;

  /** The last reaction request made per note, so a stale answer can be ignored. */
  const requests = useRef<Record<string, number>>({});

  const loadReactions = useCallback(async () => {
    if (!userId || notes.length === 0) return;

    try {
      const results = await Promise.allSettled(
        notes.map((note) => getReactions(note.uuid, note.ref, note.date)),
      );
      const data: Record<string, GetReactionsResponse> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          data[reactionKey(notes[index])] = result.value;
        }
      });
      setReactionData(data);
    } catch {
      setReactionData({});
    }
  }, [notes, userId]);

  /**
   * Identifies the notes being shown, so the reactions are fetched when the set
   * of notes changes rather than whenever the array is rebuilt — a reply count
   * ticking up does not change anybody's reactions.
   */
  const notesKey = notes.map((note) => reactionKey(note)).join("|");
  const loadRef = useRef(loadReactions);
  loadRef.current = loadReactions;

  useEffect(() => {
    if (ready) {
      void loadRef.current();
    }
  }, [ready, notesKey]);

  const changeReaction = useCallback(
    (note: NoteEntity, next: string | null) => {
      if (!userId) return;

      const key = reactionKey(note);
      const previous = reactionDataRef.current[key]?.userReaction ?? null;
      if (previous === next) return;

      const request = (requests.current[key] ?? 0) + 1;
      requests.current[key] = request;

      const stillLatest = () => requests.current[key] === request;

      const show = (from: string | null, to: string | null) => {
        setReactionData((current) => {
          const entry = current[key];
          return {
            ...current,
            [key]: {
              reactionCounts: moveReaction(
                entry?.reactionCounts ?? note.reactionCounts ?? {},
                from,
                to,
              ),
              userReaction: to ?? undefined,
              reactions: entry?.reactions ?? [],
            },
          };
        });
      };

      show(previous, next);

      const settle = async () => {
        try {
          if (next === null) {
            await deleteReaction(note.uuid, note.ref, note.date);
          } else {
            await putReaction(note.uuid, note.ref, note.date, next);
          }
        } catch (error) {
          remoteLog("error", "[Reactions] Failed to save reaction", {
            error,
            next,
          });
          if (stillLatest()) show(next, previous);
          return;
        }

        try {
          const confirmed = await getReactions(note.uuid, note.ref, note.date);
          if (!stillLatest()) return;
          setReactionData((current) => ({ ...current, [key]: confirmed }));
        } catch (error) {
          remoteLog("warn", "[Reactions] Could not confirm the reaction", {
            error,
          });
        }
      };

      void settle();
    },
    [userId],
  );

  return { reactionData, changeReaction };
}
