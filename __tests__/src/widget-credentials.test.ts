import { initializeWidget } from "../../src/widgets/initializeWidget";

const mockReload = jest.fn();
jest.mock("@use-voltra/android-client", () => ({
  reloadAndroidWidgets: (...args: unknown[]) => mockReload(...args),
}));

const mockReloadWidgets = jest.mocked(mockReload);

describe("initializeWidget", () => {
  beforeEach(() => {
    mockReload.mockClear();
  });

  it("calls reloadAndroidWidgets with the proverb widget", async () => {
    await initializeWidget();
    expect(mockReload).toHaveBeenCalledWith(["proverb_widget"]);
  });

  it("does not throw on success", async () => {
    await initializeWidget();
  });

  it("handles errors gracefully", async () => {
    mockReload.mockRejectedValueOnce(new Error("Network error"));
    await expect(initializeWidget()).rejects.toThrow("Network error");
    expect(mockReload).toHaveBeenCalledWith(["proverb_widget"]);
  });
});
