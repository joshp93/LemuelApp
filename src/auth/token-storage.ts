import AsyncStorage from "@react-native-async-storage/async-storage";
import { remoteLog } from "../api/remote-logger";

const ID_TOKEN_KEY = "cognito_id_token";
const ACCESS_TOKEN_KEY = "cognito_access_token";
const REFRESH_TOKEN_KEY = "cognito_refresh_token";

/**
 * The set of authentication tokens provided by Cognito.
 */
export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Saves the authentication tokens to secure storage.
 * @param tokens The authentication tokens to save.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  try {
    await AsyncStorage.setItem(ID_TOKEN_KEY, tokens.idToken);
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error saving auth tokens", { error });
  }
}

/**
 * Retrieves the authentication tokens from secure storage.
 * @returns The stored tokens, or null if they don't exist.
 */
export async function getTokens(): Promise<AuthTokens | null> {
  try {
    const idToken = await AsyncStorage.getItem(ID_TOKEN_KEY);
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

    if (idToken && accessToken && refreshToken) {
      return { idToken, accessToken, refreshToken };
    }
    return null;
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error getting auth tokens", { error });
    return null;
  }
}

/**
 * Removes all authentication tokens from secure storage.
 */
export async function clearTokens(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ID_TOKEN_KEY);
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    remoteLog("error", "[TokenStorage] Error clearing auth tokens", { error });
  }
}
