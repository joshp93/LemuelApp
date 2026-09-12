import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { getValidIdToken } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

const ACCOUNT_CREATED_KEY = "ACCOUNT_CREATED";

export interface AccountDetails {
  pk: string;
  sk: string;
  accountCreatedDate: string;
  totalMeditations: number;
  totalNotes: number;
  displayName: string;
  replyNotificationsEnabled?: boolean;
}

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

export async function createAccountRecord(
  displayName: string,
): Promise<boolean> {
  const token = await getValidIdToken();
  if (!token) {
    remoteLog("error", "[Account] No valid ID token, cannot create account");
    return false;
  }

  const decoded = jwtDecode<{ sub: string }>(token);
  const uuid = decoded.sub;

  try {
    remoteLog("debug", "[Account] Creating account record", { displayName });
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/accounts/${uuid}/create`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
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
 * The device token is the token which is used to identify this device when sending notifications. All users receive a device token and they don't have to be logged in,
 * but in order for us to send them account specific notifications (such as reply notifications) we need to link their device token to their account.
 * This function updates the device token record, attaching their uuid to it.
 * Requires the user to be logged in.
 * @param The user's device token
 */
export async function linkDeviceToken(deviceToken: string): Promise<boolean> {
  const token = await getValidIdToken();
  if (!token) {
    return false;
  }

  const decoded = jwtDecode<{ sub: string }>(token);
  const uuid = decoded.sub;

  try {
    remoteLog("debug", "[Account] Linking device token to account", {
      deviceToken,
      uuid,
    });
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/accounts/${uuid}/device-tokens`,
      {
        method: "PUT",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceToken }),
      },
    );
    remoteLog("info", "[Account] Device token linked to account successfully");
    return response.ok;
  } catch (error) {
    remoteLog("error", "[Account] Failed to link device token to account", {
      error,
    });
    return false;
  }
}

export async function deleteAccount(uuid: string): Promise<boolean> {
  const token = await getValidIdToken();
  if (!token) {
    remoteLog("error", "[Account] No valid ID token, cannot delete account");
    return false;
  }

  try {
    const response = await fetch(`${LEMUEL_API_BASE_URL}/accounts/${uuid}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });

    if (!response.ok) {
      remoteLog("error", "[Account] Delete account failed", {
        status: response.status,
      });
      return false;
    }

    remoteLog("info", "[Account] Account deleted successfully");
    await AsyncStorage.removeItem(ACCOUNT_CREATED_KEY);
    remoteLog("info", "[Account] ACCOUNT_CREATED_KEY cleared");
    return true;
  } catch (error) {
    remoteLog("error", "[Account] Delete account error", { error });
    return false;
  }
}

export async function updateAccount(
  uuid: string,
  fields: { displayName?: string; replyNotificationsEnabled?: boolean },
): Promise<boolean> {
  const token = await getValidIdToken();
  if (!token) {
    remoteLog("error", "[Account] No valid ID token, cannot update account");
    return false;
  }

  try {
    const response = await fetch(`${LEMUEL_API_BASE_URL}/accounts/${uuid}`, {
      method: "PUT",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    });

    if (!response.ok) {
      remoteLog("error", "[Account] Account update failed", {
        status: response.status,
      });
      return false;
    }

    remoteLog("info", "[Account] Account updated successfully");
    return true;
  } catch (error) {
    remoteLog("error", "[Account] Account update error", { error });
    return false;
  }
}

export async function getReplyNotificationsEnabled(
  uuid: string,
): Promise<boolean> {
  const account = await getAccountDetails(uuid);
  return account?.replyNotificationsEnabled ?? true;
}
