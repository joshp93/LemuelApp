import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { getValidIdToken } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

const ACCOUNT_CREATED_KEY = "ACCOUNT_CREATED";

/**
 * Account details returned by the backend DynamoDB table.
 */
export interface AccountDetails {
  pk: string;
  sk: string;
  accountCreatedDate: string;
  totalMeditations: number;
  totalNotes: number;
  displayName: string;
}

/**
 * Fetches the authenticated user's account details from the backend.
 * @param uuid The user's Cognito sub (userId).
 * @returns AccountDetails on success, null if the record does not exist (404).
 * @throws If the request fails for a reason other than 404.
 */
export async function getAccountDetails(
  uuid: string,
): Promise<AccountDetails | null> {
  const token = await getValidIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${LEMUEL_API_BASE_URL}/accounts/${uuid}`, {
    method: "GET",
    headers: { Authorization: token },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to get account details: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<AccountDetails>;
}

/**
 * Creates a backend account record for the currently authenticated user.
 * Guarded by an AsyncStorage flag so the API call is only made once per device.
 * Decodes the user's Cognito sub from the ID token internally.
 * @param displayName The user's display name to store on the account entity.
 * @returns true if the record was created or already existed.
 */
export async function createAccountRecord(
  displayName: string,
): Promise<boolean> {
  const created = await AsyncStorage.getItem(ACCOUNT_CREATED_KEY);
  if (created === "true") {
    remoteLog("info", "[Account] Account record already created, skipping");
    return true;
  }

  const token = await getValidIdToken();
  if (!token) {
    remoteLog("error", "[Account] No valid ID token, cannot create account");
    return false;
  }

  const decoded = jwtDecode<{ sub: string }>(token);
  const uuid = decoded.sub;

  try {
    const body = JSON.stringify({ displayName });
    remoteLog("debug", "[Account] Creating account record", { body });
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/accounts/${uuid}/create`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body,
      },
    );

    if (!response.ok) {
      remoteLog("error", "[Account] Account creation API returned", {
        status: response.status,
      });
      return false;
    }

    await AsyncStorage.setItem(ACCOUNT_CREATED_KEY, "true");
    remoteLog("info", "[Account] Account record created successfully");
    return true;
  } catch (error) {
    remoteLog("error", "[Account] Account creation failed", { error });
    return false;
  }
}

/**
 * Creates or updates the display name for a user.
 * Writes to both Cognito and DynamoDB (via backend).
 * @param uuid The user's Cognito sub (userId).
 * @param displayName The display name to set.
 * @returns true if successful.
 */
export async function upsertDisplayName(
  uuid: string,
  displayName: string,
): Promise<boolean> {
  const token = await getValidIdToken();
  if (!token) {
    remoteLog(
      "error",
      "[Account] No valid ID token, cannot update display name",
    );
    return false;
  }

  try {
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/accounts/${uuid}/display-name`,
      {
        method: "PUT",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      },
    );

    if (!response.ok) {
      remoteLog("error", "[Account] Display name update failed", {
        status: response.status,
      });
      return false;
    }

    remoteLog("info", "[Account] Display name updated successfully");
    return true;
  } catch (error) {
    remoteLog("error", "[Account] Display name update error", { error });
    return false;
  }
}
