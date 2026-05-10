import {
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession as amplifyFetchAuthSession,
  getCurrentUser as amplifyGetCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from "@aws-amplify/auth";

export interface AppAuthUser {
  userId: string;
  username: string;
  email: string;
}

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

export async function createAccount(
  email: string,
  password: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[Auth API] Creating new account...");
    await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });
    console.log("[Auth API] Account created successfully");
    return { success: true };
  } catch (error: unknown) {
    console.error("[Auth API] Account creation failed", error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
}

export async function verifyAccount(
  email: string,
  code: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[Auth API] Verifying account...");
    await amplifyConfirmSignUp({
      username: email,
      confirmationCode: code,
    });
    console.log("[Auth API] Account verified successfully");
    return { success: true };
  } catch (error: unknown) {
    console.error("[Auth API] Account verification failed", error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[Auth API] Attempting sign in...");
    await amplifySignIn({
      username: email,
      password,
    });
    console.log("[Auth API] Sign in successful");
    return { success: true };
  } catch (error: unknown) {
    console.log("[Auth API] Sign in failed", error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
}

export async function logout(): Promise<void> {
  console.log("[Auth API] Logging out...");
  await amplifySignOut();
  console.log("[Auth API] Logged out");
}

export async function getAuthenticatedUser(): Promise<AppAuthUser | null> {
  try {
    console.log("[Auth API] Getting authenticated user...");
    const user = await amplifyGetCurrentUser();
    console.log("[Auth API] User found");
    return {
      userId: user.userId,
      username: user.username,
      email: user.username,
    };
  } catch (error: unknown) {
    if ((error as Error).name === "UserUnAuthenticatedException") {
      console.log("[Auth API] No authenticated user");
      return null;
    }
    console.error("[Auth API] Error getting authenticated user", error);
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  try {
    console.log("[Auth API] Getting ID token...");
    const session = await amplifyFetchAuthSession();
    const token = session.tokens?.idToken?.toString() ?? null;
    console.log("[Auth API] ID token retrieved:", token ? "yes" : "no");
    return token;
  } catch (error: unknown) {
    console.error("[Auth API] Error getting ID token", error);
    return null;
  }
}
