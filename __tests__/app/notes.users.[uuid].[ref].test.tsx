/* eslint-disable @typescript-eslint/no-require-imports */
import { render, waitFor } from "@testing-library/react-native";
import UserNotePage from "../../app/notes/users/[uuid]/[ref]";
import { recordMeditationCompletion } from "../../src/api/meditation";
import { getUserNote } from "../../src/api/notes";
import { useProverbForTheDay } from "../../src/hooks/useProverbForTheDay";

const mockParams: { value: Record<string, string | undefined> } = {
  value: { uuid: "uuid-123", ref: "Proverbs3:5", date: "2026-06-02" },
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useLocalSearchParams: () => mockParams.value,
  Stack: { Screen: () => null },
}));

jest.mock("../../src/auth/with-auth", () => ({
  withAuth: (Component: unknown) => Component,
}));

jest.mock("../../src/api/notes", () => ({
  getUserNote: jest.fn(),
  saveUserNote: jest.fn(),
  deleteUserNote: jest.fn(),
}));

jest.mock("../../src/api/meditation", () => ({
  recordMeditationCompletion: jest.fn(),
}));

jest.mock("../../src/api/remote-logger", () => ({
  remoteLog: jest.fn(),
}));

jest.mock("../../src/hooks/useUnsavedChanges", () => ({
  useUnsavedChanges: jest.fn(),
}));

jest.mock("../../src/hooks/useFitFontSize", () => ({
  useFitFontSize: () => ({ fontSize: 28, onTextLayout: jest.fn() }),
}));

jest.mock("../../src/hooks/useProverbForTheDay", () => ({
  useProverbForTheDay: jest.fn(),
}));

jest.mock("../../src/utils/confirm", () => ({
  confirm: jest.fn().mockResolvedValue(false),
}));

jest.mock("../../src/components/proverb-card", () => ({
  ProverbCard: () => null,
}));

jest.mock("../../src/components/proverb-reference-header-text", () => ({
  ProverbReferenceHeaderText: () => null,
}));

jest.mock("../../src/components/note-editor", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ contentLoaded, editorContent }: any) =>
      React.createElement(
        Text,
        { testID: "note-editor" },
        `${contentLoaded ? "ready" : "waiting"}|${editorContent}`,
      ),
  };
});

/**
 * The page loads its editor through `React.lazy(() => import(…))`, and Babel
 * leaves that `import()` untouched, so Jest's CommonJS runtime cannot evaluate
 * it. Resolving the lazy component straight to the (mocked) module keeps the
 * page's own wiring under test.
 */
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    lazy: () => require("../../src/components/note-editor").default,
  };
});

const mockGetUserNote = getUserNote as jest.MockedFunction<typeof getUserNote>;
const mockUseProverbForTheDay = useProverbForTheDay as jest.MockedFunction<
  typeof useProverbForTheDay
>;
const mockRecordMeditationCompletion =
  recordMeditationCompletion as jest.MockedFunction<
    typeof recordMeditationCompletion
  >;

/**
 * Builds the hook result with sane defaults, so each test only states what it
 * cares about.
 */
function proverbResult(
  overrides: Partial<ReturnType<typeof useProverbForTheDay>> = {},
) {
  return {
    proverb: { ref: "Proverbs 3:5", proverb: "Trust in the LORD" },
    loading: false,
    error: null,
    selectedVersion: "niv",
    availableVersions: ["niv"],
    date: "2026-06-02",
    changeVersion: jest.fn(),
    goToDate: jest.fn(),
    ...overrides,
  };
}

describe("UserNotePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.value = {
      uuid: "uuid-123",
      ref: "Proverbs3:5",
      date: "2026-06-02",
    };
    mockGetUserNote.mockResolvedValue({
      pk: "uuid-123",
      sk: "Proverbs3:5",
      note: "<p>saved note</p>",
      dateCreated: "2026-06-01T10:00:00.000Z",
      uuid: "uuid-123",
      ref: "Proverbs3:5",
      displayName: "Test",
    });
    mockUseProverbForTheDay.mockReturnValue(proverbResult());
  });

  it("withholds the editor until the note and the proverb have loaded", async () => {
    mockUseProverbForTheDay.mockReturnValue(
      proverbResult({ proverb: null, loading: true }),
    );

    const { findByTestId } = render(<UserNotePage />);

    const editor = await findByTestId("note-editor");
    expect(editor.props.children).toMatch(/^waiting\|/);
  });

  it("reveals the editor with the saved note once everything has loaded", async () => {
    const { findByTestId } = render(<UserNotePage />);

    const editor = await findByTestId("note-editor");
    await waitFor(() => {
      expect(editor.props.children).toBe("ready|<p>saved note</p>");
    });
  });

  it("reveals the editor even when the proverb fails to load", async () => {
    mockUseProverbForTheDay.mockReturnValue(
      proverbResult({ proverb: null, error: "Network error" }),
    );

    const { findByTestId } = render(<UserNotePage />);

    const editor = await findByTestId("note-editor");
    await waitFor(() => {
      expect(editor.props.children).toBe("ready|<p>saved note</p>");
    });
  });

  it("records the meditation completion that opened the note", async () => {
    render(<UserNotePage />);

    await waitFor(() => {
      expect(mockRecordMeditationCompletion).toHaveBeenCalledWith(
        "uuid-123",
        "2026-06-02",
      );
    });
  });
});
