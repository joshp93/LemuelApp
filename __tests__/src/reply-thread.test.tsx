/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { getReplies, postReply } from "../../src/api/notes";
import ReplyThread from "../../src/components/reply-thread";

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: { View } };
});

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => ({ user: { userId: "author" } }),
}));

jest.mock("../../src/api/notes", () => ({
  getReplies: jest.fn(),
  postReply: jest.fn(),
  deleteReply: jest.fn(),
}));

jest.mock("../../src/components/reply-card", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ reply, onSaveEdit }: any) =>
      React.createElement(
        Pressable,
        {
          testID: `reply-${reply.sk}`,
          onPress: onSaveEdit ? () => onSaveEdit("edited content") : undefined,
        },
        React.createElement(Text, null, reply.content),
      ),
  };
});

jest.mock("../../src/components/reply-input", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSubmit }: any) =>
      React.createElement(Pressable, {
        testID: "submit-reply",
        onPress: () => onSubmit("a new reply"),
      }),
  };
});

const mockGetReplies = getReplies as jest.MockedFunction<typeof getReplies>;
const mockPostReply = postReply as jest.MockedFunction<typeof postReply>;

const REPLIES = [
  {
    pk: "author",
    sk: "reply#2026-06-02T08:00:00.000Z",
    content: "first",
    createdAt: "2026-06-02T09:00:00.000Z",
    authorUuid: "author",
    displayName: "Test",
  },
  {
    pk: "author",
    sk: "reply#2026-06-02T09:00:00.000Z",
    content: "second",
    createdAt: "2026-06-02T09:00:00.000Z",
    authorUuid: "author",
    displayName: "Test",
  },
];

function renderThread() {
  return render(
    <ReplyThread
      noteAuthorUuid="author"
      noteRef="Proverbs 3:5"
      noteDate="2026-06-02"
      expanded
      onCountChange={jest.fn()}
    />,
  );
}

/**
 * The thread renders its content twice — once hidden, to measure it — so the
 * pressable the user actually sees is the last match.
 */
function pressLast(elements: unknown[]) {
  fireEvent.press(elements[elements.length - 1] as never);
}

describe("ReplyThread", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReplies.mockResolvedValue({ items: REPLIES });
  });

  it("sends the sort key of the reply being edited", async () => {
    mockPostReply.mockResolvedValue({
      ...REPLIES[1],
      content: "edited content",
    });

    const { getAllByTestId } = renderThread();

    await waitFor(() => {
      expect(
        getAllByTestId("reply-reply#2026-06-02T09:00:00.000Z").length,
      ).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("reply-reply#2026-06-02T09:00:00.000Z"));

    await waitFor(() => {
      expect(mockPostReply).toHaveBeenCalledWith(
        "author",
        "Proverbs 3:5",
        "2026-06-02",
        "edited content",
        true,
        "reply#2026-06-02T09:00:00.000Z",
      );
    });
  });

  it("applies the edit to the reply that was edited and no other", async () => {
    mockPostReply.mockResolvedValue({
      ...REPLIES[1],
      content: "edited content",
    });

    const { getAllByTestId, getAllByText } = renderThread();

    await waitFor(() => {
      expect(
        getAllByTestId("reply-reply#2026-06-02T09:00:00.000Z").length,
      ).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("reply-reply#2026-06-02T09:00:00.000Z"));

    await waitFor(() => {
      expect(getAllByText("edited content").length).toBeGreaterThan(0);
    });
    expect(getAllByText("first").length).toBeGreaterThan(0);
  });

  it("sends no sort key when posting a new reply", async () => {
    mockPostReply.mockResolvedValue({
      pk: "author",
      sk: "reply#2026-06-02T10:00:00.000Z",
      content: "a new reply",
      createdAt: "2026-06-02T10:00:00.000Z",
      authorUuid: "author",
      displayName: "Test",
    });

    const { getAllByTestId } = renderThread();

    await waitFor(() => {
      expect(getAllByTestId("submit-reply").length).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("submit-reply"));

    await waitFor(() => {
      expect(mockPostReply).toHaveBeenCalledWith(
        "author",
        "Proverbs 3:5",
        "2026-06-02",
        "a new reply",
      );
    });
  });
});
