import { Alert, type AlertButton } from "react-native";
import { confirm } from "../../src/utils/confirm";

const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

const lastButtons = (): AlertButton[] => {
  const call = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
  return (call[2] ?? []) as AlertButton[];
};

describe("confirm (native)", () => {
  beforeEach(() => {
    alertSpy.mockClear();
  });

  it("resolves true when the accept button is pressed", async () => {
    const result = confirm({
      title: "Delete Note",
      message: "Are you sure?",
      confirmLabel: "Delete",
      destructive: true,
    });

    lastButtons()[1].onPress?.();

    await expect(result).resolves.toBe(true);
  });

  it("resolves false when the dismiss button is pressed", async () => {
    const result = confirm({ title: "Delete Note" });

    lastButtons()[0].onPress?.();

    await expect(result).resolves.toBe(false);
  });

  it("uses OK/Cancel defaults and a default style", () => {
    void confirm({ title: "Title" });

    const buttons = lastButtons();
    expect(buttons[0].text).toBe("Cancel");
    expect(buttons[0].style).toBe("cancel");
    expect(buttons[1].text).toBe("OK");
    expect(buttons[1].style).toBe("default");
  });

  it("marks the accept button destructive when requested", () => {
    void confirm({ title: "Title", destructive: true });

    expect(lastButtons()[1].style).toBe("destructive");
  });

  it("honours custom button labels", () => {
    void confirm({
      title: "Title",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
    });

    const buttons = lastButtons();
    expect(buttons[0].text).toBe("Keep");
    expect(buttons[1].text).toBe("Delete");
  });
});
