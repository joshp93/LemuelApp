import { jwtDecode } from "jwt-decode";
import { clearTokens, getTokens, saveTokens } from "../auth/token-storage";
import { isTokenExpired, isTokenExpiringSoon } from "../auth/token-utils";
import * as cognito from "./cognito";

/**
 * A simplified user object for use within the application.
 */
export interface AppAuthUser {
  userId: string;
  username: string;
  email: string;
}

/**
 * Checks if a user exists by calling a custom backend API endpoint.
 * This is used to provide a better UX during sign-up.
 * @param email The email to check.
 * @returns True if the user exists, false otherwise.
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    console.log("[Auth API] Checking if user exists:", email);
    const response = await fetch(
      new Request(
        "https://8ndcvtnwf1.execute-api.eu-west-2.amazonaws.com/prod/auth/check-user-exists",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      ),
    );
    const data = (await response.json()) as { exists: boolean };
    console.log("[Auth API] User exists:", data.exists);
    return data.exists === true;
  } catch (error) {
    console.log("[Auth API] Error checking if user exists", error);
    return false;
  }
}

/**
 * Creates a new user account in Cognito.
 * A confirmation email is automatically sent as part of the sign-up process.
 * @param email The user's email, which will also be their username.
 * @param password The user's chosen password.
 * @returns An object indicating success or failure.
 */
export async function createAccount(
  email: string,
  password: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[Auth API] Creating new account...");
    await cognito.signUp(email, password);
    console.log("[Auth API] Account created successfully (confirmation email sent automatically)");
    return { success: true };
  } catch (error: any) {
    console.error("[Auth API] Account creation failed", error);
    return { success: false, message: error.message };
  }
}

/**
 * Verifies a new user's account using a confirmation code.
 * @param email The user's email.
 * @param code The verification code they received.
 * @returns An object indicating success or failure.
 */
export async function verifyAccount(
  email: string,
  code: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[Auth API] Verifying account...");
    await cognito.confirmSignUp(email, code);
    console.log("[Auth API] Account verified successfully");
    return { success: true };
  } catch (error: any) {
    console.error("[Auth API] Account verification failed", error);
    return { success: false, message: error.message };
  }
}

export async function resendVerificationCode(
  email: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[Auth API] Resending verification code...");
    await cognito.resendConfirmationCode(email);
    console.log("[Auth API] Verification code resent");
    return { success: true };
  } catch (error: any) {
    console.error("[Auth API] Resend verification code failed", error);
    return { success: false, message: error.message };
  }
}

/**
 * Signs the user in and securely stores their session tokens.
 * @param email The user's email.
 * @param password The user's password.
 * @returns An object indicating success or failure.
 *          If account is not confirmed, returns { success: false, requiresConfirmation: true }
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; message?: string; requiresConfirmation?: boolean }> {
  try {
    console.log("[Auth API] Attempting sign in...");
    const response = await cognito.signIn(email, password);
    const { IdToken, AccessToken, RefreshToken } =
      response.AuthenticationResult || {};

    if (IdToken && AccessToken && RefreshToken) {
      await saveTokens({
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      });
      console.log("[Auth API] Sign in successful");
      return { success: true };
    }
    return { success: false, message: "Sign in failed to return tokens." };
  } catch (error: any) {
    console.error("[Auth API] Sign in failed", error);
    
    // Check if the error is due to unconfirmed user account
    if (error.name === "UserNotConfirmedException" || error.code === "UserNotConfirmedException") {
      console.log("[Auth API] User account not confirmed yet");
      return { success: false, requiresConfirmation: true, message: "Please confirm your account first." };
    }
    
    return { success: false, message: error.message };
  }
}

/**
 * Signs the user out by invalidating their token with Cognito and clearing local storage.
 */
export async function signOut(): Promise<void> {
  try {
    console.log("[Auth API] Logging out...");
    const tokens = await getTokens();
    if (tokens?.accessToken) {
      await cognito.signOut(tokens.accessToken);
    }
  } catch (error) {
    console.error("[Auth API] Error during sign out", error);
  } finally {
    await clearTokens();
    console.log("[Auth API] Local tokens cleared");
  }
}

/**
 * Retrieves the current authenticated user's details by decoding the stored ID token.
 * This does not make a network request.
 * @returns The user's details, or null if no valid session is found.
 */
export async function getAuthenticatedUser(): Promise<AppAuthUser | null> {
  try {
    const tokens = await getTokens();
    if (!tokens) {
      return null;
    }

    const decoded = jwtDecode<{ sub: string; email: string }>(tokens.idToken);

    return {
      userId: decoded.sub,
      username: decoded.email,
      email: decoded.email,
    };
  } catch (error) {
    console.error("[Auth API] Error getting authenticated user", error);
    await clearTokens();
    return null;
  }
}

/**
 * Attempts to refresh the access and ID tokens using the stored refresh token.
 * On success, updates stored tokens. On failure, clears all tokens.
 * @returns True if refresh was successful, false otherwise
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    console.log("[Auth API] Attempting to refresh access token...");
    const tokens = await getTokens();

    if (!tokens?.refreshToken) {
      console.log("[Auth API] No refresh token available");
      return false;
    }

    if (isTokenExpired(tokens.refreshToken)) {
      console.log("[Auth API] Refresh token is expired, clearing tokens");
      await clearTokens();
      return false;
    }

    const newTokens = await cognito.refreshTokens(tokens.refreshToken);

    if (!newTokens) {
      console.error(
        "[Auth API] Refresh token call failed or returned no tokens",
      );
      await clearTokens();
      return false;
    }

    await saveTokens({
      idToken: newTokens.idToken,
      accessToken: newTokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    console.log("[Auth API] Access token refreshed successfully");
    return true;
  } catch (error) {
    console.error("[Auth API] Error refreshing access token", error);
    await clearTokens();
    return false;
  }
}

/**
 * Gets a valid access token, refreshing if necessary.
 * This function provides the "middleware" behavior - call this before any API request
 * that needs an access token. It proactively refreshes if the token is expired or expiring soon.
 * On refresh failure, clears tokens and returns null.
 * @returns Valid access token string, or null if no valid token available
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const tokens = await getTokens();

    if (!tokens?.accessToken) {
      console.log("[Auth API] No access token stored");
      return null;
    }

    if (isTokenExpired(tokens.accessToken)) {
      console.log("[Auth API] Access token expired, attempting refresh...");
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      const newTokens = await getTokens();
      return newTokens?.accessToken || null;
    }

    if (isTokenExpiringSoon(tokens.accessToken)) {
      console.log(
        "[Auth API] Access token expiring soon, proactively refreshing...",
      );
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      const newTokens = await getTokens();
      return newTokens?.accessToken || null;
    }

    return tokens.accessToken;
  } catch (error) {
    console.error("[Auth API] Error getting valid access token", error);
    return null;
  }
}

/**
 * Gets the raw ID token for the currently authenticated user.
 * This is the old simple getter - use getValidIdToken() for automatic refresh.
 * @returns The ID token string, or null if not signed in.
 */
export async function getIdToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.idToken || null;
}

/**
 * Gets a valid ID token, refreshing if necessary.
 * Use this when you need to ensure the ID token is fresh.
 * @returns Valid ID token string, or null if no valid token available
 */
export async function getValidIdToken(): Promise<string | null> {
  try {
    const tokens = await getTokens();

    if (!tokens?.idToken) {
      console.log("[Auth API] No ID token stored");
      return null;
    }

    if (isTokenExpired(tokens.idToken)) {
      console.log("[Auth API] ID token expired, attempting refresh...");
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      const newTokens = await getTokens();
      return newTokens?.idToken || null;
    }

    if (isTokenExpiringSoon(tokens.idToken)) {
      console.log(
        "[Auth API] ID token expiring soon, proactively refreshing...",
      );
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      const newTokens = await getTokens();
      return newTokens?.idToken || null;
    }

    return tokens.idToken;
  } catch (error) {
    console.error("[Auth API] Error getting valid ID token", error);
    return null;
  }
}
