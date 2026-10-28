import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { remoteLog } from "../api/remote-logger";
import type { AuthTokens } from "./token-types";

export type { AuthTokens } from "./token-types";

const ID_TOKEN_KEY = "cognito_id_token";
const ACCESS_TOKEN_KEY = "cognito_access_token";
const REFRESH_TOKEN_KEY = "cognito_refresh_token";

const TOKEN_KEYS = [ID_TOKEN_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY] as const;

/** Tokens read this session, so a request does not touch the keystore again. */
let cached: AuthTokens | null | undefined;

/** The migration to run, shared so concurrent reads move the tokens once. */
let migration: Promise<void> | null = null;
let migrationFinished = false;

/**
 * Reads the tokens stored by earlier versions of the app.
 *
 * @returns The legacy tokens, or null when they are not all present.
 */
async function readLegacyTokens(): Promise<AuthTokens | null> {
  const [idToken, accessToken, refreshToken] = await Promise.all(
    TOKEN_KEYS.map((key) => AsyncStorage.getItem(key)),
  );

  if (idToken && accessToken && refreshToken) {
    return { idToken, accessToken, refreshToken };
  }
  return null;
}

/**
 * Moves tokens out of AsyncStorage and into the platform keystore.
 *
 * Earlier versions stored every token unencrypted in AsyncStorage. The move
 * happens once; the legacy copies are removed only after the secure write
 * succeeds, so a failed migration leaves the user signed in.
 */
async function migrateLegacyTokens(): Promise<void> {
  if (migrationFinished) return;

  if (!migration) {
    migration = (async () => {
      const legacy = await readLegacyTokens();
      if (!legacy) {
        migrationFinished = true;
        return;
      }

      await Promise.all([
        SecureStore.setItemAsync(ID_TOKEN_KEY, legacy.idToken),
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, legacy.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, legacy.refreshToken),
      ]);
      await AsyncStorage.multiRemove([...TOKEN_KEYS]);
      remoteLog("info", "[TokenStorage] Tokens moved to secure storage");
      migrationFinished = true;
    })();
  }

  try {
    await migration;
  } catch (error) {
    remoteLog(
      "error",
      "[TokenStorage] Could not move tokens to secure storage",
      {
        error,
      },
    );
  } finally {
    migration = null;
  }
}

/**
 * Reads all three tokens from the platform keystore.
 *
 * @returns The tokens, or null when any is missing.
 */
async function readSecureTokens(): Promise<AuthTokens | null> {
  const [idToken, accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ID_TOKEN_KEY),
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  if (idToken && accessToken && refreshToken) {
    return { idToken, accessToken, refreshToken };
  }
  return null;
}

/**
 * Saves the authentication tokens to the platform keystore.
 *
 * @param tokens - The tokens to save.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  cached = tokens;

  try {
    await Promise.all([
      SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken),
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
    await AsyncStorage.multiRemove([...TOKEN_KEYS]);
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error saving auth tokens", { error });
  }
}

/**
 * Retrieves the authentication tokens from the platform keystore.
 *
 * The result is cached in memory for the rest of the session, so repeated
 * authenticated requests do not each read the keystore.
 *
 * @returns The stored tokens, or null if they don't exist.
 */
export async function getTokens(): Promise<AuthTokens | null> {
  if (cached !== undefined) return cached;

  try {
    await migrateLegacyTokens();
    cached = (await readSecureTokens()) ?? (await readLegacyTokens());
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error getting auth tokens", { error });
    cached = await readLegacyTokens().catch(() => null);
  }

  return cached;
}

/**
 * Removes all authentication tokens from both stores.
 */
export async function clearTokens(): Promise<void> {
  cached = null;

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ID_TOKEN_KEY),
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      AsyncStorage.multiRemove([...TOKEN_KEYS]),
    ]);
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error clearing auth tokens", { error });
  }
}
