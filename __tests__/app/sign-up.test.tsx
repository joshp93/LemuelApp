import { fireEvent, render, waitFor } from "@testing-library/react-native";
import SignUp from "../../app/sign-up";
import { createAccount } from "../../src/api/auth";

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockParams,
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/api/auth", () => ({
  createAccount: jest.fn(),
}));

const mockCreateAccount = createAccount as jest.MockedFunction<
  typeof createAccount
>;

describe("SignUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it("should render email, password, and confirm password inputs", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
  });

  it("should show validation error for empty email", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUp />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent(emailInput, "blur");

    await waitFor(() => {
      expect(getByText("Email is required")).toBeTruthy();
    });
  });

  it("should show validation error for invalid email", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUp />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent(emailInput, "focus");
    fireEvent.changeText(emailInput, "not-an-email");
    fireEvent(emailInput, "blur");

    await waitFor(() => {
      expect(getByText("Please enter a valid email address")).toBeTruthy();
    });
  });

  it("should show validation error for weak password", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUp />);
    const passwordInput = getByPlaceholderText("Password");

    fireEvent(passwordInput, "focus");
    fireEvent.changeText(passwordInput, "weak");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(getByText("Password must be at least 8 characters")).toBeTruthy();
    });
  });

  it("should show validation error for password without number", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUp />);
    const passwordInput = getByPlaceholderText("Password");

    fireEvent(passwordInput, "focus");
    fireEvent.changeText(passwordInput, "NoNumbers");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(getByText("Password must contain at least 1 number")).toBeTruthy();
    });
  });

  it("should show validation error for password without uppercase", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUp />);
    const passwordInput = getByPlaceholderText("Password");

    fireEvent(passwordInput, "focus");
    fireEvent.changeText(passwordInput, "nouppercase1");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(
        getByText("Password must contain at least 1 uppercase letter"),
      ).toBeTruthy();
    });
  });

  it("should show validation error for password mismatch", async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <SignUp />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "Password2");

    const signUpButtons = getAllByText("Sign Up");
    fireEvent.press(signUpButtons[1]);

    await waitFor(() => {
      expect(getByText("Passwords do not match")).toBeTruthy();
    });
  });

  it("should create account and navigate to verification", async () => {
    mockCreateAccount.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "Password1");

    const signUpButton = getAllByText("Sign Up");
    fireEvent.press(signUpButton[1]);

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith(
        "test@example.com",
        "Password1",
      );
    });

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/confirm-sign-up",
      params: { email: "test@example.com" },
    });
  });

  it("should forward redirect param to confirm-sign-up when present", async () => {
    mockParams = { redirect: "/notes/users/abc-123/ref-456" };
    mockCreateAccount.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "Password1");

    const signUpButton = getAllByText("Sign Up");
    fireEvent.press(signUpButton[1]);

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith(
        "test@example.com",
        "Password1",
      );
    });

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/confirm-sign-up",
      params: {
        email: "test@example.com",
        redirect: "/notes/users/abc-123/ref-456",
      },
    });
  });

  it("should show error message on account creation failure", async () => {
    mockCreateAccount.mockResolvedValueOnce({
      success: false,
      message: "Email already exists",
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <SignUp />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "Password1");

    const signUpButton = getAllByText("Sign Up");
    fireEvent.press(signUpButton[1]);

    await waitFor(() => {
      expect(getByText("Email already exists")).toBeTruthy();
    });
  });

  it("should toggle password visibility", () => {
    const { getByText } = render(<SignUp />);

    expect(getByText("Show")).toBeTruthy();

    fireEvent.press(getByText("Show"));

    expect(getByText("Hide")).toBeTruthy();
  });
});
