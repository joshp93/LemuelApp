import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { getValidIdToken } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

const ACCOUNT_CREATED_KEY = "ACCOUNT_CREATED";

/**
 * Account details returned by the backend DynamoDB table.
 * Maps to the AccountEntitySchema in the lemuel backend repo.
 */
export interface AccountDetails {
  pk: string;
  sk: string;
  accountCreatedDate: string;
  totalMeditations: number;
  totalNotes: number;
}

/**
 * Fetches the authenticated user's account details from the backend.
 * Uses the Cognito ID token in the Authorization header — ID tokens carry
 * user identity claims and are the correct token type for web API auth.
 * Access tokens are only for direct Cognito API calls (e.g. GlobalSignOut).
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
 * Uses the ID token in the Authorization header — ID tokens carry user identity
 * claims and are the correct token type for web request auth headers.
 * Access tokens are only for direct Cognito API calls (e.g. GlobalSignOut).
 * @returns true if the record was created or already existed.
 */
export async function createAccountRecord(): Promise<boolean> {
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
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/accounts/${uuid}/create`,
      {
        method: "POST",
        headers: { Authorization: token },
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
