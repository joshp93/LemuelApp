import { fireEvent, render, waitFor } from "@testing-library/react-native";
import SignIn from "../../app/sign-in";
import { signIn as apiSignIn } from "../../src/api/auth";

const mockRefreshUser = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDispatch = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("../../src/api/cognito", () => {
  return {
    signIn: jest.fn().mockResolvedValue({ success: true }),
  };
});

jest.mock("expo-router", () => ({
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

jest.mock("../../src/api/account", () => ({
  createAccountRecord: jest.fn(),
}));

const mockSignIn = apiSignIn as jest.MockedFunction<typeof apiSignIn>;
const { createAccountRecord: mockCreateAccountRecord } = jest.requireMock(
  "../../src/api/account",
);

describe("SignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
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
    expect(mockCreateAccountRecord).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("should sign in and navigate to redirect param when present", async () => {
    mockParams = { redirect: "/notes/users/abc-123/ref-456" };
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockCreateAccountRecord).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/notes/users/abc-123/ref-456");
  });

  it("should sign in and navigate to home when redirect param is empty", async () => {
    mockParams = { redirect: "" };
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("should dispatch popToTop on successful sign in", async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockDispatch).toHaveBeenCalled();
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
});
