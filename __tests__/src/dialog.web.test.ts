import { notify, showDialog } from "../../src/utils/dialog.web";

const mockAlert = jest.fn();
const mockConfirm = jest.fn();

beforeEach(() => {
  mockAlert.mockReset();
  mockConfirm.mockReset();
  (
    globalThis as unknown as {
      window: { alert: jest.Mock; confirm: jest.Mock };
    }
  ).window = { alert: mockAlert, confirm: mockConfirm };
});

describe("showDialog (web)", () => {
  it("uses a single-button alert when there is one action", async () => {
    await expect(
      showDialog({
        title: "Title",
        message: "Body",
        actions: [{ id: "ok", label: "OK" }],
      }),
    ).resolves.toBe("ok");

    expect(mockAlert).toHaveBeenCalledWith("Title\n\nBody");
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("resolves the affirmative action when the confirmation is accepted", async () => {
    mockConfirm.mockReturnValue(true);

    await expect(
      showDialog({
        title: "Delete",
        actions: [
          { id: "cancel", label: "Cancel", style: "cancel" },
          { id: "delete", label: "Delete", style: "destructive" },
        ],
      }),
    ).resolves.toBe("delete");

    expect(mockConfirm).toHaveBeenCalledWith("Delete");
  });

  it("resolves the cancel action when the confirmation is declined", async () => {
    mockConfirm.mockReturnValue(false);

    await expect(
      showDialog({
        title: "Delete",
        actions: [
          { id: "cancel", label: "Cancel", style: "cancel" },
          { id: "delete", label: "Delete" },
        ],
      }),
    ).resolves.toBe("cancel");
  });

  it("asks about each choice in turn when there are more than two", async () => {
    mockConfirm.mockReturnValueOnce(false).mockReturnValueOnce(true);

    await expect(
      showDialog({
        title: "Unsaved Changes",
        actions: [
          { id: "save", label: "Save" },
          { id: "discard", label: "Discard", style: "destructive" },
          { id: "cancel", label: "Cancel", style: "cancel" },
        ],
      }),
    ).resolves.toBe("discard");

    expect(mockConfirm).toHaveBeenNthCalledWith(1, "Unsaved Changes\n\nSave?");
    expect(mockConfirm).toHaveBeenNthCalledWith(
      2,
      "Unsaved Changes\n\nDiscard?",
    );
  });

  it("resolves the cancel action when every choice is declined", async () => {
    mockConfirm.mockReturnValue(false);

    await expect(
      showDialog({
        title: "Unsaved Changes",
        actions: [
          { id: "save", label: "Save" },
          { id: "discard", label: "Discard", style: "destructive" },
          { id: "cancel", label: "Cancel", style: "cancel" },
        ],
      }),
    ).resolves.toBe("cancel");
  });

  it("resolves null during SSR", async () => {
    (globalThis as unknown as { window: unknown }).window = undefined;

    await expect(
      showDialog({ title: "Title", actions: [{ id: "ok", label: "OK" }] }),
    ).resolves.toBeNull();

    expect(mockAlert).not.toHaveBeenCalled();
  });
});

describe("notify (web)", () => {
  it("uses a browser alert", async () => {
    await expect(notify("Error", "Something failed")).resolves.toBeUndefined();

    expect(mockAlert).toHaveBeenCalledWith("Error\n\nSomething failed");
  });
});
