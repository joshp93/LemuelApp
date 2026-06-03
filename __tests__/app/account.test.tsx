import { render, waitFor } from "@testing-library/react-native";
import Account from "../../app/account";
import { getAccountDetails } from "../../src/api/account";

const mockRedirect = jest.fn();
const mockAuthUser: {
  value: {
    user: {
      userId: string;
      email: string;
      username: string;
      token: string;
    } | null;
    loading: boolean;
    signOut: jest.Mock;
    refreshUser: jest.Mock;
    refreshToken: jest.Mock;
  };
} = {
  value: {
    user: null,
    loading: false,
    signOut: jest.fn(),
    refreshUser: jest.fn(),
    refreshToken: jest.fn(),
  },
};

jest.mock("expo-router", () => ({
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => mockAuthUser.value,
}));

jest.mock("../../src/api/account", () => ({
  getAccountDetails: jest.fn(),
}));

const mockGetAccountDetails = getAccountDetails as jest.MockedFunction<
  typeof getAccountDetails
>;

describe("Account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser.value = {
      user: null,
      loading: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
      refreshToken: jest.fn(),
    };
  });

  it("should redirect to email-entry if not authenticated", () => {
    render(<Account />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/email-entry" });
  });

  it("should not redirect while auth is loading", () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      loading: true,
    };

    const { toJSON } = render(<Account />);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(toJSON()).toBeNull();
  });

  it("should render account details when authenticated", async () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      user: {
        userId: "uuid-123",
        email: "test@example.com",
        username: "test@example.com",
        token: "token",
      },
    };

    mockGetAccountDetails.mockResolvedValue({
      pk: "uuid-123",
      sk: "account",
      accountCreatedDate: "2025-01-15T10:00:00.000Z",
      totalMeditations: 5,
      totalNotes: 2,
    });

    const { getByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("test@example.com")).toBeTruthy();
      expect(getByText("5")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
    });
  });

  it("should show error message on API failure", async () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      user: {
        userId: "uuid-123",
        email: "test@example.com",
        username: "test@example.com",
        token: "token",
      },
    };

    mockGetAccountDetails.mockRejectedValue(new Error("Network error"));

    const { getByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("Network error")).toBeTruthy();
    });
  });
});
