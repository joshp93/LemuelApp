import AsyncStorage from "@react-native-async-storage/async-storage";
import { remoteLog } from "../api/remote-logger";
import type { AuthTokens } from "./token-types";

export type { AuthTokens } from "./token-types";

const ID_TOKEN_KEY = "cognito_id_token";
const ACCESS_TOKEN_KEY = "cognito_access_token";
const REFRESH_TOKEN_KEY = "cognito_refresh_token";

const TOKEN_KEYS = [ID_TOKEN_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const;

/** Tokens read this session, so a request does not hit storage again. */
let cached: AuthTokens | null | undefined;

/**
 * Saves the authentication tokens to browser storage.
 *
 * The browser has no keystore, so these values are not encrypted at rest. They
 * remain readable by any script on the origin, which is why the web build keeps
 * token lifetimes short.
 *
 * @param tokens - The tokens to save.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  cached = tokens;

  try {
    await AsyncStorage.multiSet([
      [ID_TOKEN_KEY, tokens.idToken],
      [ACCESS_TOKEN_KEY, tokens.accessToken],
      [REFRESH_TOKEN_KEY, tokens.refreshToken],
    ]);
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error saving auth tokens", { error });
  }
}

/**
 * Retrieves the authentication tokens from browser storage.
 *
 * @returns The stored tokens, or null if they don't exist.
 */
export async function getTokens(): Promise<AuthTokens | null> {
  if (cached !== undefined) return cached;

  try {
    const values = await AsyncStorage.multiGet([...TOKEN_KEYS]);
    const idToken = values[0]?.[1];
    const accessToken = values[1]?.[1];
    const refreshToken = values[2]?.[1];

    cached =
      idToken && accessToken && refreshToken
        ? { idToken, accessToken, refreshToken }
        : null;
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error getting auth tokens", { error });
    cached = null;
  }

  return cached;
}

/**
 * Removes all authentication tokens from browser storage.
 */
export async function clearTokens(): Promise<void> {
  cached = null;

  try {
    await AsyncStorage.multiRemove([...TOKEN_KEYS]);
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error clearing auth tokens", { error });
  }
}
