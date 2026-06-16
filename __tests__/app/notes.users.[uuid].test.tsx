import { fireEvent, render, waitFor } from "@testing-library/react-native";
import MyMeditations from "../../app/notes/users/[uuid]";
import { getUserNotes } from "../../src/api/notes";

const mockPush = jest.fn();
const mockRedirect = jest.fn();
const mockSearchParams: { value: { uuid: string } } = {
  value: { uuid: "uuid-123" },
};

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
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockSearchParams.value,
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

jest.mock("../../src/api/notes", () => ({
  getUserNotes: jest.fn(),
}));

const mockGetUserNotes = getUserNotes as jest.MockedFunction<
  typeof getUserNotes
>;

describe("MyMeditations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser.value = {
      user: null,
      loading: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
      refreshToken: jest.fn(),
    };
    mockSearchParams.value = { uuid: "uuid-123" };
  });

  it("should redirect to email-entry if not authenticated", () => {
    render(<MyMeditations />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/email-entry" });
  });

  it("should not redirect while auth is loading", () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      loading: true,
    };

    const { toJSON } = render(<MyMeditations />);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(toJSON()).toBeNull();
  });

  it("should show loading indicator while fetching notes", async () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      user: {
        userId: "uuid-123",
        email: "test@example.com",
        username: "test@example.com",
        token: "token",
      },
    };

    mockGetUserNotes.mockReturnValue(new Promise(() => {}));

    const { getByTestId } = render(<MyMeditations />);
    expect(getByTestId("loading")).toBeTruthy();
  });

  it("should display notes in a list when loaded", async () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      user: {
        userId: "uuid-123",
        email: "test@example.com",
        username: "test@example.com",
        token: "token",
      },
    };

    mockGetUserNotes.mockResolvedValue({
      items: [
        {
          pk: "uuid-123",
          sk: "Proverbs3:5",
          note: "<p>Note content</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs3:5",
        },
        {
          pk: "uuid-123",
          sk: "Proverbs4:7",
          note: "<p>Another note</p>",
          dateCreated: "2026-06-05T12:00:00.000Z",
          date: "2026-06-05",
          uuid: "uuid-123",
          ref: "Proverbs4:7",
        },
      ],
    });

    const { getByText } = render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText("Proverbs 3:5")).toBeTruthy();
      expect(getByText("Proverbs 4:7")).toBeTruthy();
    });
  });

  it("should show empty state when no notes exist", async () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      user: {
        userId: "uuid-123",
        email: "test@example.com",
        username: "test@example.com",
        token: "token",
      },
    };

    mockGetUserNotes.mockResolvedValue({ items: [] });

    const { getByText } = render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText("No meditations yet")).toBeTruthy();
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

    mockGetUserNotes.mockRejectedValue(new Error("Network error"));

    const { getByText } = render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText("Network error")).toBeTruthy();
    });
  });

  it("should navigate to note editor when a note is pressed", async () => {
    mockAuthUser.value = {
      ...mockAuthUser.value,
      user: {
        userId: "uuid-123",
        email: "test@example.com",
        username: "test@example.com",
        token: "token",
      },
    };

    mockGetUserNotes.mockResolvedValue({
      items: [
        {
          pk: "uuid-123",
          sk: "Proverbs3:5",
          note: "<p>Note content</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs3:5",
        },
      ],
    });

    const { getByText } = render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText("Proverbs 3:5")).toBeTruthy();
    });

    fireEvent.press(getByText("Proverbs 3:5"));

    expect(mockPush).toHaveBeenCalledWith(
      "/notes/users/uuid-123/Proverbs3%3A5?date=2026-06-02",
    );
  });
});
