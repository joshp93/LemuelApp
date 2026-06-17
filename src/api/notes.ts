import { convertDisplayProverbToProverbKey } from "../utils/proverb-helper";
import { getValidIdToken } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";

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
}

/**
 * Response shape for proverb notes endpoint.
 */
export interface ProverbNotesResponse {
  items: NoteEntity[];
  lastKey?: string;
}

/**
 * Fetches a single user note for a given proverb reference.
 *
 * Makes an authenticated GET request to `/notes/users/${uuid}/${ref}`.
 * Returns the note if it exists, or `null` if no note has been saved yet (404).
 *
 * @param uuid - The user's Cognito sub (userId).
 * @param ref  - The proverb reference, e.g. `Proverbs3:5`.
 * @returns The note response on success, or `null` on 404.
 * @throws If the request fails for a reason other than 404, or if not authenticated.
 */
export async function getUserNote(
  uuid: string,
  ref: string,
): Promise<UserNoteResponse | null> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${LEMUEL_API_BASE_URL}/notes/users/${uuid}/${convertDisplayProverbToProverbKey(ref)}`,
    {
      method: "GET",
      headers: { Authorization: token },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to get user note: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<UserNoteResponse>;
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
): Promise<UserNoteResponse> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${LEMUEL_API_BASE_URL}/notes/users/${uuid}/${convertDisplayProverbToProverbKey(ref)}`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note, date }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to save user note: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<UserNoteResponse>;
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
}

/**
 * Fetches all notes for a given proverb reference.
 *
 * Makes an authenticated GET request to `/notes/proverbs/${ref}`.
 * Returns a list of note entities from all users.
 *
 * @param ref - The proverb reference, e.g. `Proverbs3:5`.
 * @returns A paginated response with note items.
 * @throws If the request fails or if not authenticated.
 */
export async function getProverbNotes(
  ref: string,
): Promise<ProverbNotesResponse> {
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
}
