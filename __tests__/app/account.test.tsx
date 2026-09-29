import { fireEvent, render, waitFor } from "@testing-library/react-native";
import Account from "../../app/account";
import { deleteAccount, getAccountDetails } from "../../src/api/account";
import { confirm } from "../../src/utils/confirm";
import { notify } from "../../src/utils/dialog";

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
  useFocusEffect: jest.fn(),
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
  usePathname: () => "/account",
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ getState: () => ({ routes: [], index: 0 }) }),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => mockAuthUser.value,
}));

jest.mock("../../src/api/account", () => ({
  getAccountDetails: jest.fn(),
  deleteAccount: jest.fn(),
  updateAccount: jest.fn(),
}));

jest.mock("../../src/utils/confirm", () => ({
  confirm: jest.fn(),
}));

jest.mock("../../src/utils/dialog", () => ({
  notify: jest.fn(),
}));

const mockGetAccountDetails = getAccountDetails as jest.MockedFunction<
  typeof getAccountDetails
>;
const mockDeleteAccount = deleteAccount as jest.MockedFunction<
  typeof deleteAccount
>;
const mockConfirm = confirm as jest.MockedFunction<typeof confirm>;
const mockNotify = notify as jest.MockedFunction<typeof notify>;

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

    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/email-entry?redirect=%2Faccount",
    });
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

  it("deletes the account when the confirmation is accepted", async () => {
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
    mockConfirm.mockResolvedValue(true);
    mockDeleteAccount.mockResolvedValue(true);

    const { getByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("Account Management")).toBeTruthy();
    });
    fireEvent.press(getByText("Account Management"));
    fireEvent.press(getByText("Delete Account"));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith({
        title: "Delete Account",
        message:
          "This action cannot be undone. All your data, notes, and account information will be permanently deleted.",
        confirmLabel: "Delete Forever",
        destructive: true,
      });
      expect(mockDeleteAccount).toHaveBeenCalledWith("uuid-123");
      expect(mockAuthUser.value.signOut).toHaveBeenCalled();
    });
  });

  it("keeps the account when the confirmation is dismissed", async () => {
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
    mockConfirm.mockResolvedValue(false);

    const { getByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("Account Management")).toBeTruthy();
    });
    fireEvent.press(getByText("Account Management"));
    fireEvent.press(getByText("Delete Account"));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(mockAuthUser.value.signOut).not.toHaveBeenCalled();
  });

  it("reports a failed deletion", async () => {
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
    mockConfirm.mockResolvedValue(true);
    mockDeleteAccount.mockResolvedValue(false);

    const { getByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("Account Management")).toBeTruthy();
    });
    fireEvent.press(getByText("Account Management"));
    fireEvent.press(getByText("Delete Account"));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        "Error",
        "Failed to delete account. Please try again.",
      );
    });
    expect(mockAuthUser.value.signOut).not.toHaveBeenCalled();
  });
});
