import type { NoteEntity } from "../api/notes";
import type { ReactionCounts } from "../models/reactions-and-replies";

/**
 * Builds the key a note's reactions are held under on the home screen.
 *
 * @param note - The note the reactions belong to.
 * @returns The note's uuid, reference and date, joined.
 */
export function reactionKey(note: Pick<NoteEntity, "uuid" | "ref" | "date">) {
  return `${note.uuid}#${note.ref}#${note.date}`;
}

/**
 * Moves one user's reaction from one emoji to another.
 *
 * Used to show a tap before the server has been asked, and again to undo it if
 * the write turns out to have failed.
 *
 * @param counts - The per-emoji counts to adjust.
 * @param previous - The emoji the user was reacting with, if any.
 * @param next - The emoji the user is reacting with now, if any. Null removes
 *   the reaction.
 * @returns The adjusted counts, or the original object when nothing moved.
 */
export function moveReaction(
  counts: ReactionCounts,
  previous: string | null,
  next: string | null,
): ReactionCounts {
  if (previous === next) return counts;

  const moved = { ...counts };
  if (previous) {
    moved[previous] = Math.max(0, (moved[previous] ?? 0) - 1);
  }
  if (next) {
    moved[next] = (moved[next] ?? 0) + 1;
  }
  return moved;
}
