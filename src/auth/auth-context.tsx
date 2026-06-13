import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as auth from "../api/auth";
import { remoteLog } from "../api/remote-logger";

export interface AuthUser {
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
      remoteLog("info", "[Auth] Checking for authenticated user");
      const authenticatedUser = await auth.getAuthenticatedUser();
      if (authenticatedUser) {
        remoteLog(
          "info",
          "[Auth] User is authenticated, fetching valid ID token",
        );
        const token = await auth.getValidIdToken();
        if (token) {
          remoteLog("info", "[Auth] User signed in successfully");
          setUser({ ...authenticatedUser, token });
        } else {
          remoteLog("info", "[Auth] No valid ID token found, user is null");
          setUser(null);
        }
      } else {
        remoteLog("info", "[Auth] No authenticated user found");
        setUser(null);
      }
    } catch (error: unknown) {
      remoteLog("error", "[Auth] Error checking auth state", { error });
      setUser(null);
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      remoteLog("info", "[Auth] Manually refreshing token");
      const success = await auth.refreshAccessToken();
      if (success) {
        remoteLog("info", "[Auth] Token refreshed successfully, updating user");
        await refreshUser();
      } else {
        remoteLog("info", "[Auth] Token refresh failed, signing out");
        setUser(null);
      }
      return success;
    } catch (error: unknown) {
      remoteLog("error", "[Auth] Error refreshing token", { error });
      setUser(null);
      return false;
    }
  }, [refreshUser]);

  useEffect(() => {
    remoteLog("info", "[Auth] Initializing auth state");
    const initialize = async () => {
      await refreshUser();
      setLoading(false);
    };
    initialize();
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    remoteLog("info", "[Auth] Signing out user");
    await auth.signOut();
    remoteLog("info", "[Auth] User signed out");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, refreshToken, signOut }}
    >
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
