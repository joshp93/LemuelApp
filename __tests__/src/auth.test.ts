import { jwtDecode } from "jwt-decode";
import * as AuthAPI from "../../src/api/auth";
import * as Cognito from "../../src/api/cognito";
import * as TokenStorage from "../../src/auth/token-storage";

// ONLY mock the lowest-level dependencies.
jest.mock("jwt-decode");

describe("Auth API", () => {
  beforeEach(() => {
    // Restore all spies before each test
    jest.restoreAllMocks();
  });

  describe("signIn", () => {
    it("should save tokens and return success on successful sign-in", async () => {
      const mockTokens = {
        IdToken: "id-token",
        AccessToken: "access-token",
        RefreshToken: "refresh-token",
      };
      // Spy on the dependencies BEFORE the function is called
      const cognitoSignInSpy = jest
        .spyOn(Cognito, "signIn")
        .mockResolvedValue({ AuthenticationResult: mockTokens } as any);
      const saveTokensSpy = jest
        .spyOn(TokenStorage, "saveTokens")
        .mockResolvedValue(undefined);

      const result = await AuthAPI.signIn("test@example.com", "password");

      expect(cognitoSignInSpy).toHaveBeenCalledWith(
        "test@example.com",
        "password",
      );
      expect(saveTokensSpy).toHaveBeenCalledWith({
        idToken: "id-token",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("signOut", () => {
    it("should sign out via Cognito and clear local tokens", async () => {
      jest
        .spyOn(TokenStorage, "getTokens")
        .mockResolvedValue({ accessToken: "access-token" } as any);
      const signOutSpy = jest
        .spyOn(Cognito, "signOut")
        .mockResolvedValue({} as any);
      const clearTokensSpy = jest
        .spyOn(TokenStorage, "clearTokens")
        .mockResolvedValue(undefined);

      await AuthAPI.signOut();

      expect(signOutSpy).toHaveBeenCalledWith("access-token");
      expect(clearTokensSpy).toHaveBeenCalled();
    });
  });

  describe("getAuthenticatedUser", () => {
    it("should return a user object if a valid token exists", async () => {
      jest
        .spyOn(TokenStorage, "getTokens")
        .mockResolvedValue({ idToken: "valid-token" } as any);
      const mockJwtDecode = jwtDecode as jest.Mock;
      mockJwtDecode.mockReturnValue({
        sub: "user-id",
        email: "user@example.com",
      });

      const user = await AuthAPI.getAuthenticatedUser();

      expect(mockJwtDecode).toHaveBeenCalledWith("valid-token");
      expect(user).toEqual({
        userId: "user-id",
        username: "user@example.com",
        email: "user@example.com",
      });
    });
  });
});
