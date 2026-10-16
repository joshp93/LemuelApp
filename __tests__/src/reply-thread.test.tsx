/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { deleteReply, getReplies, postReply } from "../../src/api/notes";
import ReplyThread from "../../src/components/reply-thread";

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: { View } };
});

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => ({ user: { userId: "author", displayName: "Joshua" } }),
}));

jest.mock("../../src/api/notes", () => ({
  getReplies: jest.fn(),
  postReply: jest.fn(),
  deleteReply: jest.fn(),
}));

jest.mock("../../src/utils/dialog", () => ({
  notify: jest.fn(),
}));

jest.mock("../../src/components/reply-card", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ reply, onSaveEdit, onDelete }: any) =>
      React.createElement(
        Pressable,
        {
          testID: `reply-${reply.sk}`,
          onPress: onSaveEdit ? () => onSaveEdit("edited content") : undefined,
        },
        React.createElement(Text, null, reply.content),
        React.createElement(Text, null, `by ${reply.displayName}`),
        onDelete
          ? React.createElement(Pressable, {
              testID: `delete-${reply.sk}`,
              onPress: onDelete,
            })
          : null,
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
        onPress: () => {
          onSubmit("a new reply").catch(() => {});
        },
      }),
  };
});

const mockGetReplies = getReplies as jest.MockedFunction<typeof getReplies>;
const mockPostReply = postReply as jest.MockedFunction<typeof postReply>;
const mockDeleteReply = deleteReply as jest.MockedFunction<typeof deleteReply>;

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

function renderThread(onCountChange = jest.fn()) {
  return render(
    <ReplyThread
      noteAuthorUuid="author"
      noteRef="Proverbs 3:5"
      noteDate="2026-06-02"
      expanded
      onCountChange={onCountChange}
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

  it("shows a new reply before the server has answered", async () => {
    const onCountChange = jest.fn();
    let resolvePost!: (reply: unknown) => void;
    mockPostReply.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }) as never,
    );

    const { getAllByTestId, getAllByText } = renderThread(onCountChange);

    await waitFor(() => {
      expect(getAllByTestId("submit-reply").length).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("submit-reply"));

    await waitFor(() => {
      expect(getAllByText("a new reply").length).toBeGreaterThan(0);
    });
    expect(onCountChange).toHaveBeenCalledWith(1);

    await act(async () => {
      resolvePost({ ...REPLIES[0], sk: "reply#saved", content: "a new reply" });
    });

    expect(getAllByText("a new reply").length).toBeGreaterThan(0);
  });

  it("names the author on a reply shown before the server has answered", async () => {
    mockPostReply.mockReturnValue(new Promise(() => {}) as never);

    const { getAllByTestId, getAllByText } = renderThread();

    await waitFor(() => {
      expect(getAllByTestId("submit-reply").length).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("submit-reply"));

    await waitFor(() => {
      expect(getAllByText("by Joshua").length).toBeGreaterThan(0);
    });
  });

  it("takes a new reply back when the server refuses it", async () => {
    const onCountChange = jest.fn();
    mockPostReply.mockRejectedValue(new Error("offline"));

    const { getAllByTestId, queryAllByText } = renderThread(onCountChange);

    await waitFor(() => {
      expect(getAllByTestId("submit-reply").length).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("submit-reply"));

    await waitFor(() => {
      expect(onCountChange).toHaveBeenCalledWith(-1);
    });
    expect(queryAllByText("a new reply")).toHaveLength(0);
  });

  it("applies an edit before the server has answered", async () => {
    let resolvePost!: (reply: unknown) => void;
    mockPostReply.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }) as never,
    );

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

    await act(async () => {
      resolvePost({ ...REPLIES[1], content: "edited content" });
    });

    expect(getAllByText("edited content").length).toBeGreaterThan(0);
  });

  it("takes a reply away before the server has answered", async () => {
    const onCountChange = jest.fn();
    let resolveDelete!: () => void;
    mockDeleteReply.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveDelete = resolve;
      }),
    );

    const { getAllByTestId, queryAllByText } = renderThread(onCountChange);

    await waitFor(() => {
      expect(
        getAllByTestId("delete-reply#2026-06-02T09:00:00.000Z").length,
      ).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("delete-reply#2026-06-02T09:00:00.000Z"));

    expect(queryAllByText("second")).toHaveLength(0);
    expect(onCountChange).toHaveBeenCalledWith(-1);

    await act(async () => {
      resolveDelete();
    });

    expect(queryAllByText("second")).toHaveLength(0);
  });

  it("puts a reply back where it was when the delete fails", async () => {
    const onCountChange = jest.fn();
    let rejectDelete!: (error: Error) => void;
    mockDeleteReply.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectDelete = reject;
      }),
    );

    const { getAllByTestId, queryAllByText } = renderThread(onCountChange);

    await waitFor(() => {
      expect(
        getAllByTestId("delete-reply#2026-06-02T09:00:00.000Z").length,
      ).toBeGreaterThan(0);
    });

    pressLast(getAllByTestId("delete-reply#2026-06-02T09:00:00.000Z"));
    expect(queryAllByText("second")).toHaveLength(0);

    await act(async () => {
      rejectDelete(new Error("offline"));
    });

    expect(queryAllByText("second").length).toBeGreaterThan(0);
    expect(onCountChange).toHaveBeenCalledWith(1);
  });
});
