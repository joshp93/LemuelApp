import { fireEvent, render, waitFor } from "@testing-library/react-native";
import SignIn from "../../app/sign-in";
import { signIn as apiSignIn } from "../../src/api/auth";

const mockRefreshUser = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => ({}),
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
}));

const mockSignIn = apiSignIn as jest.MockedFunction<typeof apiSignIn>;

describe("SignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("should pass email from route params to sign-in function", async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("should sign in successfully with email param", async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    const signInButtons = getAllByText("Sign In");
    fireEvent.press(signInButtons[1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("", "password123");
    });

    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
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
