import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { DialogHost } from "../../src/components/dialog-host";
import { notify, showDialog } from "../../src/utils/dialog";

describe("showDialog", () => {
  it("draws the title, the message and every action", async () => {
    const { getByText } = render(<DialogHost />);

    act(() => {
      void showDialog({
        title: "Unsaved changes",
        message: "You have unsaved changes.",
        actions: [
          { id: "save", label: "Save" },
          { id: "discard", label: "Discard", style: "destructive" },
          { id: "cancel", label: "Cancel", style: "cancel" },
        ],
      });
    });

    await waitFor(() => {
      expect(getByText("Unsaved changes")).toBeTruthy();
    });
    expect(getByText("You have unsaved changes.")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Discard")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("resolves the chosen action's id", async () => {
    const { getByTestId } = render(<DialogHost />);

    let result: Promise<string | null>;
    act(() => {
      result = showDialog({
        title: "Title",
        actions: [
          { id: "save", label: "Save" },
          { id: "discard", label: "Discard" },
        ],
      });
    });

    await waitFor(() => {
      expect(getByTestId("dialog-action-discard")).toBeTruthy();
    });
    fireEvent.press(getByTestId("dialog-action-discard"));

    await expect(result!).resolves.toBe("discard");
  });

  it("resolves null when the overlay is pressed", async () => {
    const { getByTestId } = render(<DialogHost />);

    let result: Promise<string | null>;
    act(() => {
      result = showDialog({
        title: "Title",
        actions: [{ id: "ok", label: "OK" }],
      });
    });

    await waitFor(() => {
      expect(getByTestId("dialog-overlay")).toBeTruthy();
    });
    fireEvent.press(getByTestId("dialog-overlay"));

    await expect(result!).resolves.toBeNull();
  });

  it("draws nothing until a dialog is asked for", () => {
    const { queryByTestId } = render(<DialogHost />);

    expect(queryByTestId("lemuel-dialog")).toBeNull();
  });

  it("takes the dialog away once it has been answered", async () => {
    const { getByTestId, queryByTestId } = render(<DialogHost />);

    act(() => {
      void showDialog({ title: "Title", actions: [{ id: "ok", label: "OK" }] });
    });

    await waitFor(() => {
      expect(getByTestId("dialog-action-ok")).toBeTruthy();
    });
    fireEvent.press(getByTestId("dialog-action-ok"));

    await waitFor(() => {
      expect(queryByTestId("lemuel-dialog")).toBeNull();
    });
  });

  it("dismisses an unanswered dialog when another is asked for", async () => {
    const { getByTestId, getByText } = render(<DialogHost />);

    let first: Promise<string | null>;
    act(() => {
      first = showDialog({
        title: "First",
        actions: [{ id: "ok", label: "OK" }],
      });
    });

    await waitFor(() => {
      expect(getByText("First")).toBeTruthy();
    });

    act(() => {
      void showDialog({
        title: "Second",
        actions: [{ id: "ok", label: "OK" }],
      });
    });

    await expect(first!).resolves.toBeNull();
    await waitFor(() => {
      expect(getByText("Second")).toBeTruthy();
    });
    expect(getByTestId("lemuel-dialog")).toBeTruthy();
  });
});

describe("notify", () => {
  it("offers a single OK button and resolves once it is pressed", async () => {
    const { getByTestId, getByText } = render(<DialogHost />);

    let result: Promise<void>;
    act(() => {
      result = notify("Error", "Something failed");
    });

    await waitFor(() => {
      expect(getByText("Error")).toBeTruthy();
    });
    expect(getByText("Something failed")).toBeTruthy();

    fireEvent.press(getByTestId("dialog-action-ok"));

    await expect(result!).resolves.toBeUndefined();
  });
});
