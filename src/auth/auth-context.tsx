import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as auth from "../api/auth";

interface AuthUser {
  userId: string;
  username: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      console.log("[Auth] Checking for authenticated user...");
      const authenticatedUser = await auth.getAuthenticatedUser();
      if (authenticatedUser) {
        console.log("[Auth] User is authenticated, fetching valid ID token...");
        const token = await auth.getValidIdToken();
        if (token) {
          console.log("[Auth] User signed in successfully");
          setUser({ ...authenticatedUser, token });
        } else {
          console.log("[Auth] No valid ID token found, user is null");
          setUser(null);
        }
      } else {
        console.log("[Auth] No authenticated user found");
        setUser(null);
      }
    } catch (error: unknown) {
      console.error("[Auth] Error checking auth state", error);
      setUser(null);
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Auth] Manually refreshing token...");
      const success = await auth.refreshAccessToken();
      if (success) {
        console.log("[Auth] Token refreshed successfully, updating user...");
        // Re-fetch user with new token
        await refreshUser();
      } else {
        console.log("[Auth] Token refresh failed, signing out...");
        setUser(null);
      }
      return success;
    } catch (error: unknown) {
      console.error("[Auth] Error refreshing token", error);
      setUser(null);
      return false;
    }
  }, [refreshUser]);

  useEffect(() => {
    console.log("[Auth] Initializing auth state...");
    refreshUser().finally(() => {
      console.log("[Auth] Auth initialization complete");
      setLoading(false);
    });
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    console.log("[Auth] Signing out user...");
    await auth.signOut();
    console.log("[Auth] User signed out");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, refreshToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
