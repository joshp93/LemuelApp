import { fireEvent, render, waitFor } from "@testing-library/react-native";
import NewPassword from "../../app/new-password";
import { completeNewPassword, getAuthenticatedUser } from "../../src/api/auth";
import { buildRedirectResetAction } from "../../src/utils/auth-redirect";

const mockRefreshUser = jest.fn();
const mockDispatch = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useNavigation: () => ({ dispatch: mockDispatch }),
  useLocalSearchParams: () => mockParams,
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/api/auth", () => ({
  completeNewPassword: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => ({ refreshUser: mockRefreshUser }),
}));

jest.mock("../../src/utils/auth-redirect", () => ({
  buildRedirectResetAction: jest.fn(() => "reset-action"),
}));

const mockCompleteNewPassword = completeNewPassword as jest.MockedFunction<
  typeof completeNewPassword
>;
const mockGetAuthenticatedUser = getAuthenticatedUser as jest.MockedFunction<
  typeof getAuthenticatedUser
>;
const mockBuildRedirect = buildRedirectResetAction as jest.MockedFunction<
  typeof buildRedirectResetAction
>;

describe("NewPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { email: "test@example.com", session: "challenge-session" };
    mockCompleteNewPassword.mockResolvedValue({ success: true });
    mockGetAuthenticatedUser.mockResolvedValue({
      userId: "user-1",
      username: "test@example.com",
      email: "test@example.com",
    });
  });

  it("should set the new password and continue to the requested route", async () => {
    const { getByPlaceholderText, getByText } = render(<NewPassword />);

    fireEvent.changeText(getByPlaceholderText("New password"), "NewPassword1");
    fireEvent.changeText(
      getByPlaceholderText("Confirm new password"),
      "NewPassword1",
    );
    fireEvent.press(getByText("Set password"));

    await waitFor(() => {
      expect(mockCompleteNewPassword).toHaveBeenCalledWith(
        "test@example.com",
        "challenge-session",
        "NewPassword1",
      );
    });

    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockBuildRedirect).toHaveBeenCalledWith("index", "/", "user-1");
    expect(mockDispatch).toHaveBeenCalledWith("reset-action");
  });

  it("should reject mismatched passwords without calling Cognito", async () => {
    const { getByPlaceholderText, getByText, findByText } = render(
      <NewPassword />,
    );

    fireEvent.changeText(getByPlaceholderText("New password"), "NewPassword1");
    fireEvent.changeText(
      getByPlaceholderText("Confirm new password"),
      "Different1",
    );
    fireEvent.press(getByText("Set password"));

    expect(await findByText("Passwords do not match")).toBeTruthy();
    expect(mockCompleteNewPassword).not.toHaveBeenCalled();
  });

  it("should explain that the session has expired", async () => {
    mockParams = { email: "test@example.com" };

    const { getByPlaceholderText, getByText, findByText } = render(
      <NewPassword />,
    );

    fireEvent.changeText(getByPlaceholderText("New password"), "NewPassword1");
    fireEvent.changeText(
      getByPlaceholderText("Confirm new password"),
      "NewPassword1",
    );
    fireEvent.press(getByText("Set password"));

    expect(
      await findByText(
        "This page has expired. Request a reset code to continue.",
      ),
    ).toBeTruthy();
    expect(mockCompleteNewPassword).not.toHaveBeenCalled();
  });
});
