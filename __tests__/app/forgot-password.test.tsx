import { fireEvent, render, waitFor } from "@testing-library/react-native";
import ForgotPassword from "../../app/forgot-password";
import { confirmPasswordReset, requestPasswordReset } from "../../src/api/auth";
import { notify } from "../../src/utils/dialog";

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/api/auth", () => ({
  requestPasswordReset: jest.fn(),
  confirmPasswordReset: jest.fn(),
}));

jest.mock("../../src/utils/dialog", () => ({
  notify: jest.fn().mockResolvedValue(undefined),
}));

const mockRequestReset = requestPasswordReset as jest.MockedFunction<
  typeof requestPasswordReset
>;
const mockConfirmReset = confirmPasswordReset as jest.MockedFunction<
  typeof confirmPasswordReset
>;
const mockNotify = notify as jest.MockedFunction<typeof notify>;

describe("ForgotPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockRequestReset.mockResolvedValue({ success: true });
    mockConfirmReset.mockResolvedValue({ success: true });
  });

  it("should request a reset code and reveal the confirmation fields", async () => {
    const { getByPlaceholderText, getByText, findByPlaceholderText } = render(
      <ForgotPassword />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "Test@Example.com");
    fireEvent.press(getByText("Send reset code"));

    await waitFor(() => {
      expect(mockRequestReset).toHaveBeenCalledWith("test@example.com");
    });

    expect(await findByPlaceholderText("Verification code")).toBeTruthy();
    expect(getByText("Check your email for a reset code.")).toBeTruthy();
  });

  it("should set the new password and return to sign in", async () => {
    mockParams = { email: "test@example.com" };

    const { getByPlaceholderText, getByText, findAllByText } = render(
      <ForgotPassword />,
    );

    fireEvent.press(getByText("Send reset code"));

    await waitFor(() => {
      expect(mockRequestReset).toHaveBeenCalled();
    });

    fireEvent.changeText(
      await waitFor(() => getByPlaceholderText("Verification code")),
      "123456",
    );
    fireEvent.changeText(getByPlaceholderText("New password"), "NewPassword1");
    fireEvent.changeText(
      getByPlaceholderText("Confirm new password"),
      "NewPassword1",
    );

    const buttons = await findAllByText("Set new password");
    fireEvent.press(buttons[0]);

    await waitFor(() => {
      expect(mockConfirmReset).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
        "NewPassword1",
      );
    });

    expect(mockNotify).toHaveBeenCalledWith(
      "Password reset",
      "Your password has been reset. You can now sign in.",
    );
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/sign-in",
      params: { email: "test@example.com" },
    });
  }, 15000);

  it("should reject mismatched passwords without calling the API", async () => {
    mockParams = { email: "test@example.com" };

    const { getByPlaceholderText, getByText, findByText } = render(
      <ForgotPassword />,
    );

    fireEvent.press(getByText("Send reset code"));

    await waitFor(() => {
      expect(mockRequestReset).toHaveBeenCalled();
    });

    fireEvent.changeText(
      await waitFor(() => getByPlaceholderText("Verification code")),
      "123456",
    );
    fireEvent.changeText(getByPlaceholderText("New password"), "NewPassword1");
    fireEvent.changeText(
      getByPlaceholderText("Confirm new password"),
      "Different1",
    );
    fireEvent.press(getByText("Set new password"));

    expect(await findByText("Passwords do not match")).toBeTruthy();
    expect(mockConfirmReset).not.toHaveBeenCalled();
  });
});
