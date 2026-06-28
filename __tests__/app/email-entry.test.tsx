import { fireEvent, render, waitFor } from "@testing-library/react-native";
import EmailEntry from "../../app/email-entry";
import { checkUserExists } from "../../src/api/auth";

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
  checkUserExists: jest.fn(),
}));

const mockCheckUserExists = checkUserExists as jest.MockedFunction<
  typeof checkUserExists
>;

describe("EmailEntry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it("should render email input", () => {
    const { getByPlaceholderText } = render(<EmailEntry />);
    expect(getByPlaceholderText("Email")).toBeTruthy();
  });

  it("should show validation error for empty email", async () => {
    const { getByPlaceholderText, getByText } = render(<EmailEntry />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent(emailInput, "blur");

    await waitFor(() => {
      expect(getByText("Email is required")).toBeTruthy();
    });
  });

  it("should show validation error for invalid email", async () => {
    const { getByPlaceholderText, getByText } = render(<EmailEntry />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent(emailInput, "focus");
    fireEvent.changeText(emailInput, "not-an-email");
    fireEvent(emailInput, "blur");

    await waitFor(() => {
      expect(getByText("Please enter a valid email address")).toBeTruthy();
    });
  });

  it("should navigate to sign-in when user exists", async () => {
    mockCheckUserExists.mockResolvedValueOnce(true);

    const { getByPlaceholderText, getByText } = render(<EmailEntry />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent.changeText(emailInput, "test@example.com");

    const continueButton = getByText("Continue");
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockCheckUserExists).toHaveBeenCalledWith("test@example.com");
    });

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/sign-in",
      params: { email: "test@example.com" },
    });
  });

  it("should navigate to sign-up when user does not exist", async () => {
    mockCheckUserExists.mockResolvedValueOnce(false);

    const { getByPlaceholderText, getByText } = render(<EmailEntry />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent.changeText(emailInput, "new@example.com");

    const continueButton = getByText("Continue");
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockCheckUserExists).toHaveBeenCalledWith("new@example.com");
    });

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/sign-up",
      params: { email: "new@example.com" },
    });
  });

  it("should forward redirect param to sign-in when present", async () => {
    mockParams = { redirect: "/notes/users/abc-123/ref-456" };
    mockCheckUserExists.mockResolvedValueOnce(true);

    const { getByPlaceholderText, getByText } = render(<EmailEntry />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent.changeText(emailInput, "test@example.com");

    const continueButton = getByText("Continue");
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/sign-in",
        params: {
          email: "test@example.com",
          redirect: "/notes/users/abc-123/ref-456",
        },
      });
    });
  });

  it("should forward redirect param to sign-up when present", async () => {
    mockParams = { redirect: "/settings" };
    mockCheckUserExists.mockResolvedValueOnce(false);

    const { getByPlaceholderText, getByText } = render(<EmailEntry />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent.changeText(emailInput, "new@example.com");

    const continueButton = getByText("Continue");
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/sign-up",
        params: { email: "new@example.com", redirect: "/settings" },
      });
    });
  });

  it("should show error message on API failure", async () => {
    mockCheckUserExists.mockRejectedValueOnce(new Error("Network error"));

    const { getByPlaceholderText, getByText } = render(<EmailEntry />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent.changeText(emailInput, "test@example.com");

    const continueButton = getByText("Continue");
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
  });
});
