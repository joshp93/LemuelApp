import { fireEvent, render, waitFor } from "@testing-library/react-native";
import ConfirmSignUp from "../../app/confirm-sign-up";
import { verifyAccount, resendVerificationCode } from "../../src/api/auth";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useLocalSearchParams: () => ({ email: "test@example.com" }),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/api/auth", () => ({
  verifyAccount: jest.fn(),
  resendVerificationCode: jest.fn(),
}));

const mockVerifyAccount = verifyAccount as jest.MockedFunction<
  typeof verifyAccount
>;
const mockResendVerificationCode = resendVerificationCode as jest.MockedFunction<
  typeof resendVerificationCode
>;

describe("ConfirmSignUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render email preview and code input", () => {
    const { getByPlaceholderText, getByText } = render(<ConfirmSignUp />);

    expect(getByText("test@example.com")).toBeTruthy();
    expect(getByPlaceholderText("Verification Code")).toBeTruthy();
  });

  it("should show validation error when code is empty", async () => {
    const { getByPlaceholderText, getByText, getAllByText } = render(
      <ConfirmSignUp />,
    );
    const codeInput = getByPlaceholderText("Verification Code");

    fireEvent(codeInput, "blur");

    await waitFor(() => {
      expect(getByText("Verification code is required")).toBeTruthy();
    });
  });

  it("should show validation error for invalid code length", async () => {
    const { getByPlaceholderText, getByText } = render(<ConfirmSignUp />);
    const codeInput = getByPlaceholderText("Verification Code");

    fireEvent.changeText(codeInput, "123");
    fireEvent.press(getByText("Verify"));

    await waitFor(() => {
      expect(getByText("Please enter the 6-digit code")).toBeTruthy();
    });
  });

  it("should verify account successfully", async () => {
    mockVerifyAccount.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(<ConfirmSignUp />);

    fireEvent.changeText(getByPlaceholderText("Verification Code"), "123456");

    fireEvent.press(getByText("Verify"));

    await waitFor(() => {
      expect(mockVerifyAccount).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
      );
    });

    await waitFor(() => {
      expect(
        getByText("Your email has been verified. You can now sign in."),
      ).toBeTruthy();
    });
  });

  it("should navigate to sign in on success", async () => {
    mockVerifyAccount.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(<ConfirmSignUp />);

    fireEvent.changeText(getByPlaceholderText("Verification Code"), "123456");

    fireEvent.press(getByText("Verify"));

    await waitFor(() => {
      expect(
        getByText("Your email has been verified. You can now sign in."),
      ).toBeTruthy();
    });
  });

  it("should show error message on verification failure", async () => {
    mockVerifyAccount.mockResolvedValueOnce({
      success: false,
      message: "Invalid verification code",
    });

    const { getByPlaceholderText, getByText } = render(<ConfirmSignUp />);

    fireEvent.changeText(getByPlaceholderText("Verification Code"), "000000");

    fireEvent.press(getByText("Verify"));

    await waitFor(() => {
      expect(getByText("Invalid verification code")).toBeTruthy();
    });
  });

  it("should resend verification code", async () => {
    mockResendVerificationCode.mockResolvedValueOnce({ success: true });

    const { getByText } = render(<ConfirmSignUp />);

    fireEvent.press(getByText("Resend Code"));

    await waitFor(() => {
      expect(mockResendVerificationCode).toHaveBeenCalledWith(
        "test@example.com",
      );
    });

    await waitFor(() => {
      expect(getByText("Code resent! Check your email.")).toBeTruthy();
    });
  });
});
