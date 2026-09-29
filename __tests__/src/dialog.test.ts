import { Alert, type AlertButton } from "react-native";
import { notify, showDialog } from "../../src/utils/dialog";

const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

interface AlertCall {
  title: string;
  message: string | undefined;
  buttons: AlertButton[];
  onDismiss: (() => void) | undefined;
}

const lastCall = (): AlertCall => {
  const call = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
  return {
    title: call[0],
    message: call[1],
    buttons: (call[2] ?? []) as AlertButton[],
    onDismiss: call[3]?.onDismiss,
  };
};

describe("showDialog (native)", () => {
  beforeEach(() => {
    alertSpy.mockClear();
  });

  it("resolves the chosen action's id", async () => {
    const result = showDialog({
      title: "Unsaved Changes",
      message: "You have unsaved changes.",
      actions: [
        { id: "save", label: "Save" },
        { id: "discard", label: "Discard", style: "destructive" },
        { id: "cancel", label: "Cancel", style: "cancel" },
      ],
    });

    lastCall().buttons[1].onPress?.();

    await expect(result).resolves.toBe("discard");
  });

  it("passes the title, message, labels and styles through", () => {
    void showDialog({
      title: "Title",
      message: "Message",
      actions: [
        { id: "cancel", label: "Cancel", style: "cancel" },
        { id: "ok", label: "Fine" },
      ],
    });

    const { title, message, buttons } = lastCall();
    expect(title).toBe("Title");
    expect(message).toBe("Message");
    expect(buttons[0]).toMatchObject({ text: "Cancel", style: "cancel" });
    expect(buttons[1].text).toBe("Fine");
  });

  it("resolves null when dismissed without a choice", async () => {
    const result = showDialog({
      title: "Title",
      actions: [{ id: "ok", label: "OK" }],
    });

    lastCall().onDismiss?.();

    await expect(result).resolves.toBeNull();
  });
});

describe("notify (native)", () => {
  beforeEach(() => {
    alertSpy.mockClear();
  });

  it("shows a single OK button", () => {
    void notify("Error", "Something failed");

    const { title, message, buttons } = lastCall();
    expect(title).toBe("Error");
    expect(message).toBe("Something failed");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text).toBe("OK");
  });

  it("resolves once the button is pressed", async () => {
    const result = notify("Error");

    lastCall().buttons[0].onPress?.();

    await expect(result).resolves.toBeUndefined();
  });
});
