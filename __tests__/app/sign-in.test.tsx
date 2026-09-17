import { fireEvent, render, waitFor } from "@testing-library/react-native";
import SignIn from "../../app/sign-in";
import { signIn as apiSignIn } from "../../src/api/auth";

const mockRefreshUser = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDispatch = jest.fn();
let mockParams: Record<string, string> = {};
let mockAuthenticatedUser: { userId: string } | null = {
  userId: "authenticated-user-id",
};

jest.mock("../../src/api/cognito", () => {
  return {
    signIn: jest.fn().mockResolvedValue({ success: true }),
  };
});

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({
    dispatch: mockDispatch,
  }),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
  }),
}));

jest.mock("../../src/api/auth", () => ({
  signIn: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  getDevicePushTokenAsync: () => Promise.resolve({ data: "test-push-token" }),
}));

jest.mock("../../src/api/account", () => ({
  createAccountRecord: jest.fn(),
  linkDeviceToken: jest.fn(),
}));

const mockSignIn = apiSignIn as jest.MockedFunction<typeof apiSignIn>;
const mockGetAuthenticatedUser = jest.requireMock("../../src/api/auth")
  .getAuthenticatedUser as jest.MockedFunction<
  typeof import("../../src/api/auth").getAuthenticatedUser
>;
const {
  createAccountRecord: mockCreateAccountRecord,
  linkDeviceToken: mockLinkDeviceToken,
} = jest.requireMock("../../src/api/account");

const expectResetAction = (
  routeName: string,
  params?: Record<string, string>,
) => {
  const route = params ? { name: routeName, params } : { name: routeName };
  return expect.objectContaining({
    type: "RESET",
    payload: { index: 0, routes: [route] },
  });
};

describe("SignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockAuthenticatedUser = { userId: "authenticated-user-id" };
    mockGetAuthenticatedUser.mockResolvedValue(mockAuthenticatedUser);
  });

  it("should render email preview and password input", () => {
    const { getByPlaceholderText, getAllByText } = render(<SignIn />);
    expect(getAllByText("Sign In").length).toBeGreaterThan(0);
    expect(getByPlaceholderText("Password")).toBeTruthy();
  });

  it("should show validation error when password is empty", async () => {
    const { getAllByText, getByText } = render(<SignIn />);

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(getByText("Password is required")).toBeTruthy();
    });
  });

  it("should sign in and navigate to home when no redirect param", async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockCreateAccountRecord).not.toHaveBeenCalled();
    expect(mockLinkDeviceToken).toHaveBeenCalledWith("test-push-token");
    expect(mockDispatch).toHaveBeenCalledWith(expectResetAction("index"));
  }, 15000);

  it("should sign in and navigate to redirect route with extracted params", async () => {
    mockParams = {
      redirect: "/notes/users/{{uuid}}/Pro 3:5?date=2026-09-17",
      route: "notes/users/[uuid]/[ref]",
    };
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockCreateAccountRecord).not.toHaveBeenCalled();
    expect(mockLinkDeviceToken).toHaveBeenCalledWith("test-push-token");
    expect(mockDispatch).toHaveBeenCalledWith(
      expectResetAction("notes/users/[uuid]/[ref]", {
        uuid: "authenticated-user-id",
        ref: "Pro 3:5",
        date: "2026-09-17",
      }),
    );
  }, 15000);

  it("should navigate to index when route param is empty (no auth gate)", async () => {
    mockParams = { redirect: "/notes/users/abc-123/ref-456" };
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockDispatch).toHaveBeenCalledWith(expectResetAction("index"));
  }, 15000);

  it("should create account record when displayName is present", async () => {
    mockParams = { displayName: "TestUser" };
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockCreateAccountRecord).toHaveBeenCalledWith("TestUser");
    expect(mockLinkDeviceToken).toHaveBeenCalledWith("test-push-token");
    expect(mockDispatch).toHaveBeenCalledWith(expectResetAction("index"));
  });

  it("should navigate to index when redirect param is empty", async () => {
    mockParams = { redirect: "" };
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockDispatch).toHaveBeenCalledWith(expectResetAction("index"));
  });

  it("should show error message on sign in failure", async () => {
    mockSignIn.mockResolvedValueOnce({
      success: false,
      message: "Incorrect password",
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <SignIn />,
    );

    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpassword");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(getByText("Incorrect password")).toBeTruthy();
    });
  });

  it("should toggle password visibility", () => {
    const { getByText } = render(<SignIn />);

    expect(getByText("Show")).toBeTruthy();

    fireEvent.press(getByText("Show"));

    expect(getByText("Hide")).toBeTruthy();
  });

  it("should replace {{uuid}} placeholder with authenticated user id in ref param", async () => {
    mockParams = {
      redirect: "/notes/users/{{uuid}}/Some%20Ref",
      route: "notes/users/[uuid]/[ref]",
    };
    mockGetAuthenticatedUser.mockResolvedValue({ userId: "custom-user-id" });
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expectResetAction("notes/users/[uuid]/[ref]", {
        uuid: "custom-user-id",
        ref: "Some%20Ref",
      }),
    );
  }, 15000);

  it("should redirect to confirm-sign-up when requiresConfirmation is true", async () => {
    mockParams = { email: "test@example.com" };
    mockSignIn.mockResolvedValueOnce({
      success: false,
      requiresConfirmation: true,
    });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/confirm-sign-up",
        params: { email: "test@example.com" },
      });
    });
  });
});
