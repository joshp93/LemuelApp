import {
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession as amplifyFetchAuthSession,
  getCurrentUser as amplifyGetCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  AuthTokens,
  ConfirmSignUpOutput,
  SignInOutput,
  SignUpOutput,
} from "@aws-amplify/auth";
import {
  checkUserExists,
  createAccount,
  getAuthenticatedUser,
  getIdToken,
  logout,
  signIn,
  verifyAccount,
} from "../../src/api/auth";

jest.mock("@aws-amplify/auth", () => ({
  confirmSignUp: jest.fn(),
  fetchAuthSession: jest.fn(),
  getCurrentUser: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
}));

const mockAmplifyConfirmSignUp = amplifyConfirmSignUp as jest.MockedFunction<
  typeof amplifyConfirmSignUp
>;
const mockAmplifyFetchAuthSession =
  amplifyFetchAuthSession as jest.MockedFunction<
    typeof amplifyFetchAuthSession
  >;
const mockAmplifyGetCurrentUser = amplifyGetCurrentUser as jest.MockedFunction<
  typeof amplifyGetCurrentUser
>;
const mockAmplifySignIn = amplifySignIn as jest.MockedFunction<
  typeof amplifySignIn
>;
const mockAmplifySignOut = amplifySignOut as jest.MockedFunction<
  typeof amplifySignOut
>;
const mockAmplifySignUp = amplifySignUp as jest.MockedFunction<
  typeof amplifySignUp
>;

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkUserExists", () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn();
      global.fetch = mockFetch;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return true when user exists", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ exists: true }),
      });

      const result = await checkUserExists("test@example.com");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(mockFetch.mock.calls[0][0].url).toBe(
        "https://8ndcvtnwf1.execute-api.eu-west-2.amazonaws.com/prod/auth/check-user-exists",
      );
    });

    it("should return false when user does not exist", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ exists: false }),
      });

      const result = await checkUserExists("test@example.com");

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await checkUserExists("test@example.com");

      expect(result).toBe(false);
    });

    it("should return false on invalid response", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ exists: undefined }),
      });

      const result = await checkUserExists("test@example.com");

      expect(result).toBe(false);
    });
  });

  describe("createAccount", () => {
    it("should create account successfully", async () => {
      mockAmplifySignUp.mockResolvedValueOnce({} as SignUpOutput);

      const result = await createAccount("test@example.com", "Password1");

      expect(result).toEqual({ success: true });
      expect(mockAmplifySignUp).toHaveBeenCalledWith({
        username: "test@example.com",
        password: "Password1",
        options: {
          userAttributes: {
            email: "test@example.com",
          },
        },
      });
    });

    it("should return error on failure", async () => {
      mockAmplifySignUp.mockRejectedValueOnce(
        new Error("Email already exists"),
      );

      const result = await createAccount("test@example.com", "Password1");

      expect(result).toEqual({
        success: false,
        message: "Email already exists",
      });
    });
  });

  describe("verifyAccount", () => {
    it("should verify account successfully", async () => {
      mockAmplifyConfirmSignUp.mockResolvedValueOnce({} as ConfirmSignUpOutput);

      const result = await verifyAccount("test@example.com", "123456");

      expect(result).toEqual({ success: true });
      expect(mockAmplifyConfirmSignUp).toHaveBeenCalledWith({
        username: "test@example.com",
        confirmationCode: "123456",
      });
    });

    it("should return error on failure", async () => {
      mockAmplifyConfirmSignUp.mockRejectedValueOnce(new Error("Invalid code"));

      const result = await verifyAccount("test@example.com", "000000");

      expect(result).toEqual({
        success: false,
        message: "Invalid code",
      });
    });
  });

  describe("signIn", () => {
    it("should sign in successfully", async () => {
      mockAmplifySignIn.mockResolvedValueOnce({} as SignInOutput);

      const result = await signIn("test@example.com", "Password1");

      expect(result).toEqual({ success: true });
      expect(mockAmplifySignIn).toHaveBeenCalledWith({
        username: "test@example.com",
        password: "Password1",
      });
    });

    it("should return error on failure", async () => {
      mockAmplifySignIn.mockRejectedValueOnce(
        new Error("Incorrect username or password"),
      );

      const result = await signIn("test@example.com", "WrongPassword");

      expect(result).toEqual({
        success: false,
        message: "Incorrect username or password",
      });
    });
  });

  describe("logout", () => {
    it("should call signOut", async () => {
      mockAmplifySignOut.mockResolvedValueOnce(undefined);

      await logout();

      expect(mockAmplifySignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAuthenticatedUser", () => {
    it("should return user when authenticated", async () => {
      mockAmplifyGetCurrentUser.mockResolvedValueOnce({
        userId: "user123",
        username: "test@example.com",
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        userId: "user123",
        username: "test@example.com",
        email: "test@example.com",
      });
    });

    it("should return null when not authenticated", async () => {
      mockAmplifyGetCurrentUser.mockRejectedValueOnce(
        Object.assign(new Error("Not authenticated"), {
          name: "UserUnAuthenticatedException",
        }),
      );

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it("should return null on other errors", async () => {
      mockAmplifyGetCurrentUser.mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });
  });

  describe("getIdToken", () => {
    it("should return token when available", async () => {
      mockAmplifyFetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: { toString: () => "token123" },
        } as AuthTokens,
      });

      const result = await getIdToken();

      expect(result).toBe("token123");
    });

    it("should return null when no session", async () => {
      mockAmplifyFetchAuthSession.mockResolvedValueOnce({
        tokens: undefined,
      });

      const result = await getIdToken();

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      mockAmplifyFetchAuthSession.mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await getIdToken();

      expect(result).toBeNull();
    });
  });
});
