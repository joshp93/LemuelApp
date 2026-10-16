import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { DialogHost } from "../../src/components/dialog-host";
import { confirm } from "../../src/utils/confirm";

/** Renders the host and starts a confirmation, leaving it on screen. */
async function showConfirm(
  options: Parameters<typeof confirm>[0],
): Promise<{ result: Promise<boolean>; host: ReturnType<typeof render> }> {
  const host = render(<DialogHost />);

  let result: Promise<boolean>;
  act(() => {
    result = confirm(options);
  });

  await waitFor(() => {
    expect(host.getByTestId("lemuel-dialog")).toBeTruthy();
  });

  return { result, host };
}

describe("confirm (native)", () => {
  it("resolves true when the accept button is pressed", async () => {
    const { result, host } = await showConfirm({
      title: "Delete note",
      message: "Are you sure?",
      confirmLabel: "Delete",
      destructive: true,
    });

    fireEvent.press(host.getByTestId("dialog-action-confirm"));

    await expect(result).resolves.toBe(true);
  });

  it("resolves false when the dismiss button is pressed", async () => {
    const { result, host } = await showConfirm({ title: "Delete note" });

    fireEvent.press(host.getByTestId("dialog-action-cancel"));

    await expect(result).resolves.toBe(false);
  });

  it("uses OK/Cancel defaults", async () => {
    const { host } = await showConfirm({ title: "Title" });

    expect(host.getByTestId("dialog-action-cancel")).toBeTruthy();
    expect(host.getByTestId("dialog-action-confirm")).toBeTruthy();
    expect(host.getByText("Cancel")).toBeTruthy();
    expect(host.getByText("OK")).toBeTruthy();
  });

  it("honours custom button labels", async () => {
    const { host } = await showConfirm({
      title: "Title",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
    });

    expect(host.getByText("Keep")).toBeTruthy();
    expect(host.getByText("Delete")).toBeTruthy();
  });

  it("resolves false when the dialog is dismissed", async () => {
    const { result, host } = await showConfirm({ title: "Title" });

    fireEvent.press(host.getByTestId("dialog-overlay"));

    await expect(result).resolves.toBe(false);
  });
});
