import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  deleteReaction,
  getReactions,
  type NoteEntity,
  putReaction,
} from "../../src/api/notes";
import { useNoteReactions } from "../../src/hooks/useNoteReactions";

jest.mock("../../src/api/notes", () => ({
  getReactions: jest.fn(),
  putReaction: jest.fn(),
  deleteReaction: jest.fn(),
}));

const mockGetReactions = getReactions as jest.MockedFunction<
  typeof getReactions
>;
const mockPutReaction = putReaction as jest.MockedFunction<typeof putReaction>;
const mockDeleteReaction = deleteReaction as jest.MockedFunction<
  typeof deleteReaction
>;

const NOTE = {
  pk: "note-1",
  sk: "Proverbs3:5",
  note: "<p>a note</p>",
  dateCreated: "2026-06-02T12:00:00.000Z",
  uuid: "author-1",
  ref: "Proverbs3:5",
  displayName: "Author",
  date: "2026-06-02",
} as NoteEntity;

const KEY = "author-1#Proverbs3:5#2026-06-02";

function renderReactions(
  overrides: Partial<{
    notes: NoteEntity[];
    userId: string | null;
    ready: boolean;
  }> = {},
) {
  return renderHook(
    ({ notes, userId, ready }: Required<typeof overrides>) =>
      useNoteReactions({ notes, userId, ready }),
    {
      initialProps: {
        notes: [NOTE],
        userId: "reader-1",
        ready: true,
        ...overrides,
      } as Required<typeof overrides>,
    },
  );
}

describe("useNoteReactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReactions.mockResolvedValue({ reactionCounts: {}, reactions: [] });
    mockPutReaction.mockResolvedValue(undefined);
    mockDeleteReaction.mockResolvedValue(undefined);
  });

  it("loads the reactions on every note once the page is ready", async () => {
    const { result } = renderReactions();

    await waitFor(() => {
      expect(result.current.reactionData[KEY]).toBeTruthy();
    });
    expect(mockGetReactions).toHaveBeenCalledWith(
      "author-1",
      "Proverbs3:5",
      "2026-06-02",
    );
    expect(result.current.reactionData[KEY]).toEqual({
      reactionCounts: {},
      reactions: [],
    });
  });

  it("does not reload when only a reply count changed", async () => {
    const { result, rerender } = renderReactions();
    await waitFor(() => expect(result.current.reactionData[KEY]).toBeTruthy());
    expect(mockGetReactions).toHaveBeenCalledTimes(1);

    rerender({
      notes: [{ ...NOTE, replyCount: 1 }],
      userId: "reader-1",
      ready: true,
    });

    expect(mockGetReactions).toHaveBeenCalledTimes(1);
  });

  it("reloads when a different note is shown", async () => {
    const { result, rerender } = renderReactions();
    await waitFor(() => expect(result.current.reactionData[KEY]).toBeTruthy());
    expect(mockGetReactions).toHaveBeenCalledTimes(1);

    rerender({
      notes: [{ ...NOTE, uuid: "author-2" }],
      userId: "reader-1",
      ready: true,
    });

    await waitFor(() => {
      expect(mockGetReactions).toHaveBeenCalledTimes(2);
    });
  });

  it("waits for the page before loading anything", () => {
    renderReactions({ ready: false });

    expect(mockGetReactions).not.toHaveBeenCalled();
  });

  it("loads nothing when nobody is signed in", () => {
    renderReactions({ userId: null });

    expect(mockGetReactions).not.toHaveBeenCalled();
  });

  it("shows a reaction before the server has answered", async () => {
    mockPutReaction.mockReturnValue(new Promise(() => {}));

    const { result } = renderReactions();
    await waitFor(() => expect(result.current.reactionData[KEY]).toBeTruthy());

    act(() => {
      result.current.changeReaction(NOTE, "🙏");
    });

    expect(result.current.reactionData[KEY].userReaction).toBe("🙏");
    expect(result.current.reactionData[KEY].reactionCounts["🙏"]).toBe(1);
  });

  it("settles on the counts the server reports", async () => {
    mockGetReactions
      .mockResolvedValueOnce({ reactionCounts: {}, reactions: [] })
      .mockResolvedValueOnce({
        reactionCounts: { "🙏": 5 },
        userReaction: "🙏",
        reactions: [],
      });

    const { result } = renderReactions();
    await waitFor(() => expect(result.current.reactionData[KEY]).toBeTruthy());

    act(() => {
      result.current.changeReaction(NOTE, "🙏");
    });

    await waitFor(() => {
      expect(result.current.reactionData[KEY].reactionCounts["🙏"]).toBe(5);
    });
  });

  it("takes the reaction back when the write fails", async () => {
    let rejectWrite!: (error: Error) => void;
    mockPutReaction.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectWrite = reject;
      }),
    );

    const { result } = renderReactions();
    await waitFor(() => expect(result.current.reactionData[KEY]).toBeTruthy());

    act(() => {
      result.current.changeReaction(NOTE, "🙏");
    });
    expect(result.current.reactionData[KEY].userReaction).toBe("🙏");

    await act(async () => {
      rejectWrite(new Error("offline"));
    });

    expect(result.current.reactionData[KEY].userReaction).toBeUndefined();
    expect(result.current.reactionData[KEY].reactionCounts["🙏"]).toBe(0);
  });

  it("removes a reaction by deleting it", async () => {
    mockGetReactions
      .mockResolvedValueOnce({
        reactionCounts: { "🙏": 1 },
        userReaction: "🙏",
        reactions: [],
      })
      .mockResolvedValueOnce({
        reactionCounts: {},
        reactions: [],
      });

    const { result } = renderReactions();
    await waitFor(() =>
      expect(result.current.reactionData[KEY].userReaction).toBe("🙏"),
    );

    act(() => {
      result.current.changeReaction(NOTE, null);
    });

    await waitFor(() => {
      expect(mockDeleteReaction).toHaveBeenCalledWith(
        "author-1",
        "Proverbs3:5",
        "2026-06-02",
      );
    });
    await waitFor(() => {
      expect(result.current.reactionData[KEY].reactionCounts["🙏"]).toBe(0);
    });
  });

  it("ignores the answer to a reaction that has been replaced", async () => {
    let rejectFirst!: (error: Error) => void;
    mockPutReaction.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectFirst = reject;
      }),
    );
    mockPutReaction.mockReturnValue(new Promise(() => {}));

    const { result } = renderReactions();
    await waitFor(() => expect(result.current.reactionData[KEY]).toBeTruthy());

    act(() => {
      result.current.changeReaction(NOTE, "🙏");
    });
    act(() => {
      result.current.changeReaction(NOTE, "❤️");
    });

    await act(async () => {
      rejectFirst(new Error("offline"));
    });

    expect(result.current.reactionData[KEY].userReaction).toBe("❤️");
  });
});
