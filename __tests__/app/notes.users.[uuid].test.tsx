import { fireEvent, render, waitFor } from "@testing-library/react-native";
import MyMeditations from "../../app/notes/users/[uuid]";
import { getUserNotes } from "../../src/api/notes";
import { formatDate } from "../../src/utils/date";

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
  usePathname: () => "/notes/users/uuid-123",
  useNavigation: () => ({ getState: () => ({ routes: [], index: 0 }) }),
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

    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/email-entry?redirect=%2Fnotes%2Fusers%2F%7B%7Buuid%7D%7D",
    });
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
          displayName: "Proverbs 3:5",
          note: "<p>Note content</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs3:5",
        },
        {
          pk: "uuid-123",
          sk: "Proverbs4:7",
          displayName: "Proverbs 4:7",
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

  it("should show a table header with 'Daily proverb date' and 'Proverb' columns", async () => {
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
          displayName: "Proverbs 3:5",
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
      expect(getByText("Daily proverb date")).toBeTruthy();
      expect(getByText("Proverb")).toBeTruthy();
    });
  });

  it("should display the daily proverb date rather than the note modification date", async () => {
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
          displayName: "Proverbs 3:5",
          note: "<p>Note content</p>",
          dateCreated: "2026-01-01T12:00:00.000Z",
          date: "2026-06-15",
          uuid: "uuid-123",
          ref: "Proverbs3:5",
        },
      ],
    });

    const { getByText, queryByText } = render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText(formatDate("2026-06-15"))).toBeTruthy();
    });
    expect(queryByText(formatDate("2026-01-01T12:00:00.000Z"))).toBeNull();
  });

  it("should show a search icon and hide the search input initially", async () => {
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
          displayName: "Proverbs 3:5",
          note: "<p>Note content</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs3:5",
        },
      ],
    });

    const { getByTestId, queryByPlaceholderText } = render(<MyMeditations />);

    await waitFor(() => {
      expect(getByTestId("open-search")).toBeTruthy();
    });
    expect(queryByPlaceholderText("Search by date or proverb")).toBeNull();
  });

  it("should reveal the search input when the search icon is pressed", async () => {
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
          displayName: "Proverbs 3:5",
          note: "<p>Note content</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs3:5",
        },
      ],
    });

    const { getByTestId, getByPlaceholderText } = render(<MyMeditations />);

    await waitFor(() => {
      expect(getByTestId("open-search")).toBeTruthy();
    });

    fireEvent.press(getByTestId("open-search"));

    expect(getByPlaceholderText("Search by date or proverb")).toBeTruthy();
  });

  it("should filter notes by partial proverb reference match", async () => {
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
          sk: "Proverbs23:6",
          displayName: "Proverbs 23:6",
          note: "<p>Note one</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs23:6",
        },
        {
          pk: "uuid-123",
          sk: "Proverbs4:7",
          displayName: "Proverbs 4:7",
          note: "<p>Note two</p>",
          dateCreated: "2026-06-05T12:00:00.000Z",
          date: "2026-06-05",
          uuid: "uuid-123",
          ref: "Proverbs4:7",
        },
      ],
    });

    const { getByTestId, getByPlaceholderText, getByText, queryByText } =
      render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
      expect(getByText("Proverbs 4:7")).toBeTruthy();
    });

    fireEvent.press(getByTestId("open-search"));
    fireEvent.changeText(
      getByPlaceholderText("Search by date or proverb"),
      "23:6",
    );

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
    });
    expect(queryByText("Proverbs 4:7")).toBeNull();
  });

  it("should filter notes by partial date match", async () => {
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
          sk: "Proverbs23:6",
          displayName: "Proverbs 23:6",
          note: "<p>Note one</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs23:6",
        },
        {
          pk: "uuid-123",
          sk: "Proverbs4:7",
          displayName: "Proverbs 4:7",
          note: "<p>Note two</p>",
          dateCreated: "2025-05-05T12:00:00.000Z",
          date: "2025-05-05",
          uuid: "uuid-123",
          ref: "Proverbs4:7",
        },
      ],
    });

    const { getByTestId, getByPlaceholderText, getByText, queryByText } =
      render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
      expect(getByText("Proverbs 4:7")).toBeTruthy();
    });

    fireEvent.press(getByTestId("open-search"));
    fireEvent.changeText(
      getByPlaceholderText("Search by date or proverb"),
      "2026",
    );

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
    });
    expect(queryByText("Proverbs 4:7")).toBeNull();
  });

  it("should clear the query when the x is pressed while a value exists", async () => {
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
          sk: "Proverbs23:6",
          displayName: "Proverbs 23:6",
          note: "<p>Note one</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs23:6",
        },
        {
          pk: "uuid-123",
          sk: "Proverbs4:7",
          displayName: "Proverbs 4:7",
          note: "<p>Note two</p>",
          dateCreated: "2025-05-05T12:00:00.000Z",
          date: "2025-05-05",
          uuid: "uuid-123",
          ref: "Proverbs4:7",
        },
      ],
    });

    const { getByTestId, getByPlaceholderText, getByText } = render(
      <MyMeditations />,
    );

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
    });

    fireEvent.press(getByTestId("open-search"));
    fireEvent.changeText(
      getByPlaceholderText("Search by date or proverb"),
      "23:6",
    );

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
    });

    fireEvent.press(getByTestId("close-search"));

    await waitFor(() => {
      expect(getByText("Proverbs 4:7")).toBeTruthy();
    });
    expect(getByPlaceholderText("Search by date or proverb")).toBeTruthy();
  });

  it("should close the search box when the x is pressed with no value", async () => {
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
          displayName: "Proverbs 3:5",
          note: "<p>Note content</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs3:5",
        },
      ],
    });

    const { getByTestId, getByPlaceholderText, queryByPlaceholderText } =
      render(<MyMeditations />);

    await waitFor(() => {
      expect(getByTestId("open-search")).toBeTruthy();
    });

    fireEvent.press(getByTestId("open-search"));
    expect(getByPlaceholderText("Search by date or proverb")).toBeTruthy();

    fireEvent.press(getByTestId("close-search"));

    expect(queryByPlaceholderText("Search by date or proverb")).toBeNull();
    expect(getByTestId("open-search")).toBeTruthy();
  });

  it("should filter case-insensitively", async () => {
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
          sk: "Proverbs23:6",
          displayName: "Proverbs 23:6",
          note: "<p>Note one</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02",
          uuid: "uuid-123",
          ref: "Proverbs23:6",
        },
        {
          pk: "uuid-123",
          sk: "Proverbs4:7",
          displayName: "Proverbs 4:7",
          note: "<p>Note two</p>",
          dateCreated: "2025-05-05T12:00:00.000Z",
          date: "2025-05-05",
          uuid: "uuid-123",
          ref: "Proverbs4:7",
        },
      ],
    });

    const { getByTestId, getByPlaceholderText, getByText, queryByText } =
      render(<MyMeditations />);

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
      expect(getByText("Proverbs 4:7")).toBeTruthy();
    });

    fireEvent.press(getByTestId("open-search"));
    fireEvent.changeText(
      getByPlaceholderText("Search by date or proverb"),
      "PROVERBS 23",
    );

    await waitFor(() => {
      expect(getByText("Proverbs 23:6")).toBeTruthy();
    });
    expect(queryByText("Proverbs 4:7")).toBeNull();
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
          displayName: "Proverbs 3:5",
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
