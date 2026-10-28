import { removeCache, withCache, writeCache } from "../cache/store";
import type {
  GetReactionsResponse,
  GetRepliesResponse,
  ReactionCounts,
  ReplyEntity,
} from "../models/reactions-and-replies";
import { convertDisplayProverbToProverbKey } from "../utils/proverb-helper";
import { getValidIdToken } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

/** Notes can change on another device, so a cached copy stays fresh briefly. */
const NOTES_TTL_MS = 30 * 1000;

/**
 * Builds the cache key for one reader's note on one proverb and date.
 *
 * @param uuid - The note author's Cognito UUID.
 * @param ref - The proverb reference.
 * @param date - The date of the daily proverb.
 * @returns The cache key.
 */
function noteCacheKey(uuid: string, ref: string, date?: string): string {
  return `note:${uuid}:${convertDisplayProverbToProverbKey(ref)}:${date ?? ""}`;
}

/**
 * Builds the cache key for the list of a user's notes.
 *
 * @param uuid - The user's Cognito UUID.
 * @returns The cache key.
 */
function userNotesCacheKey(uuid: string): string {
  return `user-notes:${uuid}`;
}

/**
 * Builds the cache key for a proverb's community notes.
 *
 * The reader is part of the key because the response includes their own
 * private notes and excludes everyone else's.
 *
 * @param ref - The proverb reference.
 * @param viewerId - The signed-in reader, when there is one.
 * @returns The cache key.
 */
function proverbNotesCacheKey(ref: string, viewerId?: string): string {
  const key = convertDisplayProverbToProverbKey(ref);
  return `proverb-notes:${key}:${viewerId ?? "anonymous"}`;
}

/**
 * Response shape returned by the GET and POST note endpoints.
 */
export interface UserNoteResponse {
  pk: string;
  sk: string;
  note: string;
  dateCreated: string;
  uuid: string;
  ref: string;
  isPrivate?: boolean;
  displayName: string;
}

/**
 * A single note entity as returned by the backend.
 */
export interface NoteEntity {
  pk: string;
  sk: string;
  note: string;
  dateCreated: string;
  uuid: string;
  ref: string;
  isPrivate?: boolean;
  displayName: string;
  date: string;
  reactionCounts?: ReactionCounts;
  replyCount?: number;
}

/**
 * Response shape for proverb notes endpoint.
 */
export interface ProverbNotesResponse {
  items: NoteEntity[];
  lastKey?: string;
}

/**
 * Fetches a single user note for a given proverb reference and date.
 *
 * Makes an authenticated GET request to `/notes/users/${uuid}/${ref}?date=...`.
 * Returns the note if it exists, or `null` if no note has been saved yet (404).
 *
 * @param uuid - The user's Cognito sub (userId).
 * @param ref  - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - Optional date of the daily proverb, e.g. "2026-06-16".
 * @returns The note response on success, or `null` on 404.
 * @throws If the request fails for a reason other than 404, or if not authenticated.
 */
export async function getUserNote(
  uuid: string,
  ref: string,
  date?: string,
): Promise<UserNoteResponse | null> {
  return withCache(noteCacheKey(uuid, ref, date), NOTES_TTL_MS, async () => {
    const token = await getValidIdToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const url = new URL(
      `${LEMUEL_API_BASE_URL}/notes/users/${uuid}/${convertDisplayProverbToProverbKey(ref)}`,
    );
    if (date) {
      url.searchParams.set("date", date);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: token },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to get user note: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<UserNoteResponse>;
  });
}

/**
 * Creates or updates a user note for a given proverb reference.
 *
 * Makes an authenticated POST request to `/notes/users/${uuid}/${ref}`.
 * This is an upsert — calling with the same `{uuid}/{ref}` overwrites the existing note.
 *
 * @param uuid - The user's Cognito sub (userId).
 * @param ref  - The proverb reference, e.g. `Proverbs3:5`.
 * @param note - The HTML content of the note to save.
 * @param date - The date of the daily proverb this note is for, e.g. "2026-06-16".
 * @returns The saved note entity on success.
 * @throws If the request fails or if not authenticated.
 */
export async function saveUserNote(
  uuid: string,
  ref: string,
  note: string,
  date: string,
  isPrivate?: boolean,
): Promise<UserNoteResponse> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = `${LEMUEL_API_BASE_URL}/notes/users/${uuid}/${convertDisplayProverbToProverbKey(ref)}`;
  const body = JSON.stringify({ note, date, isPrivate });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to save user note", {
      status: response.status,
    });
    throw new Error(
      `Failed to save user note: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  const saved = (await response.json()) as UserNoteResponse;
  await writeCache(noteCacheKey(uuid, ref, date), saved);
  await removeCache(userNotesCacheKey(uuid));
  return saved;
}

/**
 * Deletes a user note for a given proverb reference and date.
 *
 * Makes an authenticated DELETE request to `/notes/users/${uuid}/${ref}?date=...`.
 * Idempotent — succeeds even if the note does not exist.
 *
 * @param uuid - The user's Cognito sub (userId).
 * @param ref  - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - The date of the daily proverb, e.g. "2026-06-16".
 * @returns The response as a boolean on success.
 * @throws If the request fails or if not authenticated.
 */
export async function deleteUserNote(
  uuid: string,
  ref: string,
  date: string,
): Promise<boolean> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = new URL(
    `${LEMUEL_API_BASE_URL}/notes/users/${uuid}/${convertDisplayProverbToProverbKey(ref)}`,
  );
  url.searchParams.set("date", date);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: { Authorization: token },
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to delete user note", {
      status: response.status,
    });
    throw new Error(
      `Failed to delete user note: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  await removeCache(noteCacheKey(uuid, ref, date));
  await removeCache(userNotesCacheKey(uuid));
  return true;
}

/**
 * Fetches all notes for a given user.
 *
 * Makes an authenticated GET request to `/notes/users/${uuid}`.
 * Returns all notes belonging to the user, paginated.
 *
 * @param uuid - The user's Cognito sub (userId).
 * @returns A paginated response with note items.
 * @throws If the request fails or if not authenticated.
 */
export async function getUserNotes(
  uuid: string,
): Promise<ProverbNotesResponse> {
  return withCache(userNotesCacheKey(uuid), NOTES_TTL_MS, async () => {
    const token = await getValidIdToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${LEMUEL_API_BASE_URL}/notes/users/${uuid}`, {
      method: "GET",
      headers: { Authorization: token },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get user notes: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<ProverbNotesResponse>;
  });
}

/**
 * Fetches all notes for a given proverb reference.
 *
 * Makes an authenticated GET request to `/notes/proverbs/${ref}`.
 * Returns a list of note entities from all users. The backend takes the
 * requesting user from the access token, so the author's own private notes
 * are included in the response while other users' private notes are excluded.
 *
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @param viewerId - The signed-in reader, so the cached copy belongs to them.
 * @returns A paginated response with note items.
 * @throws If the request fails or if not authenticated.
 */
export async function getProverbNotes(
  ref: string,
  viewerId?: string,
): Promise<ProverbNotesResponse> {
  return withCache(
    proverbNotesCacheKey(ref, viewerId),
    NOTES_TTL_MS,
    async () => {
      const token = await getValidIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${LEMUEL_API_BASE_URL}/notes/proverbs/${convertDisplayProverbToProverbKey(ref)}`,
        {
          method: "GET",
          headers: { Authorization: token },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get proverb notes: ${response.status} ${response.statusText}`,
        );
      }

      return response.json() as Promise<ProverbNotesResponse>;
    },
  );
}

/**
 * Adds or updates the current user's reaction on a note.
 *
 * @param noteAuthorUuid - The note author's Cognito UUID.
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - The date of the daily proverb, e.g. "2026-06-16".
 * @param reactionType - One of the 5 emoji reactions.
 * @throws If the request fails or if not authenticated.
 */
export async function putReaction(
  noteAuthorUuid: string,
  ref: string,
  date: string,
  reactionType: string,
): Promise<void> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = `${LEMUEL_API_BASE_URL}/notes/users/${noteAuthorUuid}/${convertDisplayProverbToProverbKey(ref)}/reactions`;
  const body = JSON.stringify({ reactionType, date });

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to put reaction", {
      status: response.status,
    });
    throw new Error(
      `Failed to put reaction: ${response.status} ${response.statusText} — ${text}`,
    );
  }
}

/**
 * Removes the current user's reaction from a note.
 *
 * @param noteAuthorUuid - The note author's Cognito UUID.
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - The date of the daily proverb, e.g. "2026-06-16".
 * @throws If the request fails or if not authenticated.
 */
export async function deleteReaction(
  noteAuthorUuid: string,
  ref: string,
  date: string,
): Promise<void> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = new URL(
    `${LEMUEL_API_BASE_URL}/notes/users/${noteAuthorUuid}/${convertDisplayProverbToProverbKey(ref)}/reactions`,
  );
  url.searchParams.set("date", date);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: { Authorization: token },
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to delete reaction", {
      status: response.status,
    });
    throw new Error(
      `Failed to delete reaction: ${response.status} ${response.statusText} — ${text}`,
    );
  }
}

/**
 * Fetches all reactions for a given note.
 *
 * The backend takes the requesting user from the access token to determine
 * which reaction, if any, belongs to them.
 *
 * @param noteAuthorUuid - The note author's Cognito UUID.
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - The date of the daily proverb, e.g. "2026-06-16".
 * @returns Reaction counts, the user's reaction, and the full reaction list.
 * @throws If the request fails or if not authenticated.
 */
export async function getReactions(
  noteAuthorUuid: string,
  ref: string,
  date: string,
): Promise<GetReactionsResponse> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({ date });

  const url = `${LEMUEL_API_BASE_URL}/notes/users/${noteAuthorUuid}/${convertDisplayProverbToProverbKey(ref)}/reactions?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: token },
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to get reactions", {
      status: response.status,
    });
    throw new Error(
      `Failed to get reactions: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  return (await response.json()) as GetReactionsResponse;
}

/**
 * Creates or updates a reply on a note.
 *
 * @param noteAuthorUuid - The note author's Cognito UUID.
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - The date of the daily proverb, e.g. "2026-06-16".
 * @param content - Plain-text reply content.
 * @param isUpdate - When true, edits the reply named by `sk` and skips the
 *                   notification on the backend.
 * @param sk - The sort key of the reply being edited, as returned by
 *             {@linkcode getReplies}. Required when `isUpdate` is true; omitted
 *             when creating, since a new reply has no key yet.
 * @returns The created or updated reply entity.
 * @throws If the request fails or if not authenticated.
 */
export async function postReply(
  noteAuthorUuid: string,
  ref: string,
  date: string,
  content: string,
  isUpdate?: boolean,
  sk?: string,
): Promise<ReplyEntity> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = `${LEMUEL_API_BASE_URL}/notes/users/${noteAuthorUuid}/${convertDisplayProverbToProverbKey(ref)}/replies`;
  const body = JSON.stringify({ content, date, isUpdate, sk });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to post reply", {
      status: response.status,
    });
    throw new Error(
      `Failed to post reply: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  return (await response.json()) as ReplyEntity;
}

/**
 * Fetches paginated replies for a given note.
 *
 * @param noteAuthorUuid - The note author's Cognito UUID.
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - The date of the daily proverb, e.g. "2026-06-16".
 * @param limit - Maximum number of replies to return (optional).
 * @param lastKey - Base64-encoded cursor for pagination (optional).
 * @returns A paginated response with reply items.
 * @throws If the request fails or if not authenticated.
 */
export async function getReplies(
  noteAuthorUuid: string,
  ref: string,
  date: string,
  limit?: number,
  lastKey?: string,
): Promise<GetRepliesResponse> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({ date });
  if (limit) {
    params.set("limit", String(limit));
  }
  if (lastKey) {
    params.set("lastKey", lastKey);
  }

  const url = `${LEMUEL_API_BASE_URL}/notes/users/${noteAuthorUuid}/${convertDisplayProverbToProverbKey(ref)}/replies?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: token },
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to get replies", {
      status: response.status,
    });
    throw new Error(
      `Failed to get replies: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  return (await response.json()) as GetRepliesResponse;
}

/**
 * Deletes a reply. Only the reply author may delete.
 *
 * @param noteAuthorUuid - The note author's Cognito UUID.
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @param date - The date of the daily proverb, e.g. "2026-06-16".
 * @param replySk - The reply's sort key to identify it.
 * @throws If the request fails or if not authenticated.
 */
export async function deleteReply(
  noteAuthorUuid: string,
  ref: string,
  date: string,
  replySk: string,
): Promise<void> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = new URL(
    `${LEMUEL_API_BASE_URL}/notes/users/${noteAuthorUuid}/${convertDisplayProverbToProverbKey(ref)}/replies`,
  );
  url.searchParams.set("date", date);
  url.searchParams.set("replySk", replySk);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: { Authorization: token },
  });

  if (!response.ok) {
    const text = await response.text();
    remoteLog("error", "[Notes] Failed to delete reply", {
      status: response.status,
    });
    throw new Error(
      `Failed to delete reply: ${response.status} ${response.statusText} — ${text}`,
    );
  }
}
