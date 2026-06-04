import { act, fireEvent, render } from "@testing-library/react-native";
import { HeaderMenu } from "../../src/components/header-menu";

const mockPush = jest.fn();
const mockSignOut = jest.fn();

const mockAuthUser: {
  value: {
    user: { email: string } | null;
    signOut: jest.Mock;
  };
} = {
  value: {
    user: { email: "user@example.com" },
    signOut: mockSignOut,
  },
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => mockAuthUser.value,
}));

function openMenu() {
  const result = render(<HeaderMenu />);
  act(() => {
    fireEvent.press(result.getByTestId("burger-button"));
    jest.advanceTimersByTime(300);
  });
  return result;
}

describe("HeaderMenu", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockAuthUser.value = {
      user: { email: "user@example.com" },
      signOut: mockSignOut,
    };
  });

  it("should render the burger button", () => {
    const { getByTestId } = render(<HeaderMenu />);
    expect(getByTestId("burger-button")).toBeTruthy();
  });

  it("should show email as a button when authenticated", () => {
    const { getByText } = openMenu();
    expect(getByText("user@example.com")).toBeTruthy();
  });

  it("should navigate to account when email is pressed", () => {
    const { getByText } = openMenu();
    act(() => {
      fireEvent.press(getByText("user@example.com"));
      jest.advanceTimersByTime(300);
    });
    expect(mockPush).toHaveBeenCalledWith("/account");
  });

  it("should render Sign In when not authenticated", () => {
    mockAuthUser.value = { user: null, signOut: mockSignOut };

    const { getByText } = openMenu();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("should call signOut when Sign Out is pressed", () => {
    const { getByText } = openMenu();
    act(() => {
      fireEvent.press(getByText("Sign Out"));
      jest.advanceTimersByTime(300);
    });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should render Settings menu item", () => {
    const { getByText } = openMenu();
    expect(getByText("Settings")).toBeTruthy();
  });

  it("should navigate to settings when pressed", () => {
    const { getByText } = openMenu();
    act(() => {
      fireEvent.press(getByText("Settings"));
      jest.advanceTimersByTime(300);
    });
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });
});
