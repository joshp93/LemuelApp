import { fireEvent, render } from "@testing-library/react-native";
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
  const { getByTestId } = render(<HeaderMenu />);
  fireEvent.press(getByTestId("burger-button"));
}

describe("HeaderMenu", () => {
  beforeEach(() => {
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
    const { getByTestId, getByText } = render(<HeaderMenu />);
    fireEvent.press(getByTestId("burger-button"));

    expect(getByText("user@example.com")).toBeTruthy();
  });

  it("should navigate to account when email is pressed", () => {
    const { getByTestId, getByText } = render(<HeaderMenu />);
    fireEvent.press(getByTestId("burger-button"));

    fireEvent.press(getByText("user@example.com"));

    expect(mockPush).toHaveBeenCalledWith("/account");
  });

  it("should render Sign In when not authenticated", () => {
    mockAuthUser.value = { user: null, signOut: mockSignOut };

    const { getByTestId, getByText } = render(<HeaderMenu />);
    fireEvent.press(getByTestId("burger-button"));

    expect(getByText("Sign In")).toBeTruthy();
  });

  it("should call signOut when Sign Out is pressed", () => {
    const { getByTestId, getByText } = render(<HeaderMenu />);
    fireEvent.press(getByTestId("burger-button"));

    fireEvent.press(getByText("Sign Out"));

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should render Settings menu item", () => {
    const { getByTestId, getByText } = render(<HeaderMenu />);
    fireEvent.press(getByTestId("burger-button"));

    expect(getByText("Settings")).toBeTruthy();
  });

  it("should navigate to settings when pressed", () => {
    const { getByTestId, getByText } = render(<HeaderMenu />);
    fireEvent.press(getByTestId("burger-button"));

    fireEvent.press(getByText("Settings"));

    expect(mockPush).toHaveBeenCalledWith("/settings");
  });
});
