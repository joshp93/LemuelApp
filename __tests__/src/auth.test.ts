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

    it("should ask for a new password when Cognito returns the challenge", async () => {
      jest.spyOn(Cognito, "signIn").mockResolvedValue({
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        Session: "challenge-session",
      } as any);

      const result = await AuthAPI.signIn("test@example.com", "temporary");

      expect(result).toEqual({
        success: false,
        newPasswordRequired: true,
        session: "challenge-session",
        message: "Your password has been reset. Please choose a new one.",
      });
    });

    it("should signal a password reset when Cognito requires one", async () => {
      const error = new Error("Password reset required");
      error.name = "PasswordResetRequiredException";
      jest.spyOn(Cognito, "signIn").mockRejectedValue(error);

      const result = await AuthAPI.signIn("test@example.com", "old-password");

      expect(result).toEqual({
        success: false,
        passwordResetRequired: true,
        message: "Your password has been reset. Please request a reset code.",
      });
    });
  });

  describe("requestPasswordReset", () => {
    it("should send a reset code", async () => {
      const forgotPasswordSpy = jest
        .spyOn(Cognito, "forgotPassword")
        .mockResolvedValue({} as any);

      const result = await AuthAPI.requestPasswordReset("test@example.com");

      expect(forgotPasswordSpy).toHaveBeenCalledWith("test@example.com");
      expect(result).toEqual({ success: true });
    });

    it("should report a failure message", async () => {
      jest
        .spyOn(Cognito, "forgotPassword")
        .mockRejectedValue(new Error("User does not exist"));

      const result = await AuthAPI.requestPasswordReset("test@example.com");

      expect(result).toEqual({
        success: false,
        message: "User does not exist",
      });
    });
  });

  describe("confirmPasswordReset", () => {
    it("should set the new password", async () => {
      const confirmSpy = jest
        .spyOn(Cognito, "confirmForgotPassword")
        .mockResolvedValue({} as any);

      const result = await AuthAPI.confirmPasswordReset(
        "test@example.com",
        "123456",
        "NewPassword1",
      );

      expect(confirmSpy).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
        "NewPassword1",
      );
      expect(result).toEqual({ success: true });
    });

    it("should report a failure message", async () => {
      jest
        .spyOn(Cognito, "confirmForgotPassword")
        .mockRejectedValue(new Error("Code mismatch"));

      const result = await AuthAPI.confirmPasswordReset(
        "test@example.com",
        "000000",
        "NewPassword1",
      );

      expect(result).toEqual({ success: false, message: "Code mismatch" });
    });
  });

  describe("completeNewPassword", () => {
    it("should answer the challenge and save the resulting tokens", async () => {
      const mockTokens = {
        IdToken: "id-token",
        AccessToken: "access-token",
        RefreshToken: "refresh-token",
      };
      const challengeSpy = jest
        .spyOn(Cognito, "respondToNewPasswordChallenge")
        .mockResolvedValue({ AuthenticationResult: mockTokens } as any);
      const saveTokensSpy = jest
        .spyOn(TokenStorage, "saveTokens")
        .mockResolvedValue(undefined);

      const result = await AuthAPI.completeNewPassword(
        "test@example.com",
        "challenge-session",
        "NewPassword1",
      );

      expect(challengeSpy).toHaveBeenCalledWith(
        "test@example.com",
        "challenge-session",
        "NewPassword1",
      );
      expect(saveTokensSpy).toHaveBeenCalledWith({
        idToken: "id-token",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(result).toEqual({ success: true });
    });

    it("should fail when no tokens are returned", async () => {
      jest
        .spyOn(Cognito, "respondToNewPasswordChallenge")
        .mockResolvedValue({} as any);

      const result = await AuthAPI.completeNewPassword(
        "test@example.com",
        "challenge-session",
        "NewPassword1",
      );

      expect(result).toEqual({
        success: false,
        message: "Password updated, but sign in did not complete.",
      });
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
