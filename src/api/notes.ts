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
    `${LEMUEL_API_BASE_URL}/notes/users/${uuid}/${ref}`,
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
 * @returns The saved note entity on success.
 * @throws If the request fails or if not authenticated.
 */
export async function saveUserNote(
  uuid: string,
  ref: string,
  note: string,
): Promise<UserNoteResponse> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${LEMUEL_API_BASE_URL}/notes/users/${uuid}/${ref}`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to save user note: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<UserNoteResponse>;
}