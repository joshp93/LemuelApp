import { jwtDecode } from "jwt-decode";
import { clearTokens, getTokens, saveTokens } from "../auth/token-storage";
import { getTimeUntilExpiration, isTokenExpired } from "../auth/token-utils";
import * as cognito from "./cognito";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

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
    remoteLog("info", "[Auth API] Checking if user exists", { email });
    const response = await fetch(
      `${LEMUEL_API_BASE_URL}/auth/check-user-exists`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      },
    );
    const data = (await response.json()) as { exists: boolean };
    remoteLog("info", "[Auth API] User exists", { exists: data.exists });
    return data.exists === true;
  } catch (error) {
    remoteLog("info", "[Auth API] Error checking if user exists", { error });
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
    remoteLog("info", "[Auth API] Creating new account");
    await cognito.signUp(email, password);
    remoteLog(
      "info",
      "[Auth API] Account created successfully (confirmation email sent automatically)",
    );
    return { success: true };
  } catch (error: any) {
    remoteLog("error", "[Auth API] Account creation failed", { error });
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
    remoteLog("info", "[Auth API] Verifying account");
    await cognito.confirmSignUp(email, code);
    remoteLog("info", "[Auth API] Account verified successfully");
    return { success: true };
  } catch (error: any) {
    remoteLog("error", "[Auth API] Account verification failed", { error });
    return { success: false, message: error.message };
  }
}

export async function resendVerificationCode(
  email: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    remoteLog("info", "[Auth API] Resending verification code");
    await cognito.resendConfirmationCode(email);
    remoteLog("info", "[Auth API] Verification code resent");
    return { success: true };
  } catch (error: any) {
    remoteLog("error", "[Auth API] Resend verification code failed", { error });
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
): Promise<{
  success: boolean;
  message?: string;
  requiresConfirmation?: boolean;
  newPasswordRequired?: boolean;
  passwordResetRequired?: boolean;
  session?: string;
}> {
  try {
    remoteLog("info", "[Auth API] Attempting sign in");
    const response = await cognito.signIn(email, password);

    if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      remoteLog("info", "[Auth API] User must choose a new password");
      return {
        success: false,
        newPasswordRequired: true,
        session: response.Session,
        message: "Your password has been reset. Please choose a new one.",
      };
    }

    const { IdToken, AccessToken, RefreshToken } =
      response.AuthenticationResult || {};

    if (IdToken && AccessToken && RefreshToken) {
      await saveTokens({
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      });
      remoteLog("info", "[Auth API] Sign in successful");
      return { success: true };
    }
    return { success: false, message: "Sign in failed to return tokens." };
  } catch (error: any) {
    remoteLog("error", "[Auth API] Sign in failed", { error });

    if (
      error.name === "PasswordResetRequiredException" ||
      error.code === "PasswordResetRequiredException"
    ) {
      remoteLog("info", "[Auth API] User must reset their password");
      return {
        success: false,
        passwordResetRequired: true,
        message: "Your password has been reset. Please request a reset code.",
      };
    }

    if (
      error.name === "UserNotConfirmedException" ||
      error.code === "UserNotConfirmedException"
    ) {
      remoteLog("info", "[Auth API] User account not confirmed yet");
      return {
        success: false,
        requiresConfirmation: true,
        message: "Please confirm your account first.",
      };
    }

    return { success: false, message: error.message };
  }
}

/**
 * Sends a password-reset code to an email address.
 *
 * @param email - The user's email address.
 * @returns Whether the code was sent, and a message on failure.
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    remoteLog("info", "[Auth API] Requesting password reset");
    await cognito.forgotPassword(email);
    return { success: true };
  } catch (error: any) {
    remoteLog("error", "[Auth API] Password reset request failed", { error });
    return { success: false, message: error.message };
  }
}

/**
 * Sets a new password using a code from the reset email.
 *
 * @param email - The user's email address.
 * @param code - The verification code from the reset email.
 * @param newPassword - The password to set.
 * @returns Whether the password was changed, and a message on failure.
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    remoteLog("info", "[Auth API] Confirming password reset");
    await cognito.confirmForgotPassword(email, code, newPassword);
    return { success: true };
  } catch (error: any) {
    remoteLog("error", "[Auth API] Password reset confirmation failed", {
      error,
    });
    return { success: false, message: error.message };
  }
}

/**
 * Answers Cognito's new-password challenge and stores the resulting tokens.
 *
 * @param email - The user's email address.
 * @param session - The challenge session returned by the failed sign-in.
 * @param newPassword - The password to set.
 * @returns Whether the password was set and the user signed in.
 */
export async function completeNewPassword(
  email: string,
  session: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    remoteLog("info", "[Auth API] Completing new-password challenge");
    const response = await cognito.respondToNewPasswordChallenge(
      email,
      session,
      newPassword,
    );
    const { IdToken, AccessToken, RefreshToken } =
      response.AuthenticationResult || {};

    if (IdToken && AccessToken && RefreshToken) {
      await saveTokens({
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      });
      remoteLog("info", "[Auth API] New password accepted");
      return { success: true };
    }

    return {
      success: false,
      message: "Password updated, but sign in did not complete.",
    };
  } catch (error: any) {
    remoteLog("error", "[Auth API] New-password challenge failed", { error });
    return { success: false, message: error.message };
  }
}

/**
 * Signs the user out by invalidating their token with Cognito and clearing local storage.
 */
export async function signOut(): Promise<void> {
  try {
    remoteLog("info", "[Auth API] Logging out");
    const tokens = await getTokens();
    if (tokens?.accessToken) {
      await cognito.signOut(tokens.accessToken);
    }
  } catch (error) {
    remoteLog("error", "[Auth API] Error during sign out", { error });
  } finally {
    await clearTokens();
    remoteLog("info", "[Auth API] Local tokens cleared");
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
    remoteLog("error", "[Auth API] Error getting authenticated user", {
      error,
    });
    await clearTokens();
    return null;
  }
}

/** How long before expiry a token is refreshed proactively. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

/** The refresh currently running, shared by every caller that needs one. */
let inFlightRefresh: Promise<boolean> | null = null;

/**
 * Attempts to refresh the access and ID tokens using the stored refresh token.
 *
 * Concurrent callers share a single refresh, so several requests that observe
 * the same expiring token do not each call Cognito.
 *
 * @returns True if refresh was successful, false otherwise
 */
export function refreshAccessToken(): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = performRefreshAccessToken().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

/**
 * Refreshes the stored tokens, replacing them on success and clearing them on
 * failure.
 *
 * @returns True if refresh was successful, false otherwise
 */
async function performRefreshAccessToken(): Promise<boolean> {
  try {
    remoteLog("info", "[Auth API] Attempting to refresh access token");
    const tokens = await getTokens();

    if (!tokens?.refreshToken) {
      remoteLog("info", "[Auth API] No refresh token available");
      return false;
    }

    if (isTokenExpired(tokens.refreshToken)) {
      remoteLog("info", "[Auth API] Refresh token is expired, clearing tokens");
      await clearTokens();
      return false;
    }

    const newTokens = await cognito.refreshTokens(tokens.refreshToken);

    if (!newTokens) {
      remoteLog(
        "debug",
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

    remoteLog("info", "[Auth API] Access token refreshed successfully");
    return true;
  } catch (error) {
    remoteLog("error", "[Auth API] Error refreshing access token", { error });
    await clearTokens();
    return false;
  }
}

/**
 * Reads a stored token, refreshing it first when it has expired or is about to.
 *
 * The expiry is decoded once per call, and the refresh is shared with any other
 * caller that needs one at the same time.
 *
 * @param kind - Which stored token to read.
 * @returns The token, or null when it cannot be made valid
 */
async function getValidToken(
  kind: "idToken" | "accessToken",
): Promise<string | null> {
  try {
    const tokens = await getTokens();
    const token = tokens?.[kind];

    if (!token) {
      remoteLog("info", `[Auth API] No ${kind} stored`);
      return null;
    }

    if (getTimeUntilExpiration(token) > REFRESH_MARGIN_MS) {
      return token;
    }

    remoteLog("info", `[Auth API] ${kind} expiring, attempting refresh`);
    if (!(await refreshAccessToken())) {
      return null;
    }

    const refreshed = await getTokens();
    return refreshed?.[kind] ?? null;
  } catch (error) {
    remoteLog("error", `[Auth API] Error getting a valid ${kind}`, { error });
    return null;
  }
}

/**
 * Gets a valid access token, refreshing if necessary.
 * @returns Valid access token string, or null if no valid token available
 */
export function getValidAccessToken(): Promise<string | null> {
  return getValidToken("accessToken");
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
 * @returns Valid ID token string, or null if no valid token available
 */
export function getValidIdToken(): Promise<string | null> {
  return getValidToken("idToken");
}
