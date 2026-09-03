import { reloadAndroidWidgets } from "voltra/android/client";
import { initializeWidget } from "../../src/widgets/initializeWidget";

jest.mock("voltra/android/client", () => ({
  reloadAndroidWidgets: jest.fn(),
}));

const mockReloadWidgets = reloadAndroidWidgets as jest.MockedFunction<
  typeof reloadAndroidWidgets
>;

describe("initializeWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReloadWidgets.mockResolvedValue(undefined);
  });

  it("should reload the proverb_widget", async () => {
    await initializeWidget();

    expect(mockReloadWidgets).toHaveBeenCalledWith(["proverb_widget"]);
    expect(mockReloadWidgets).toHaveBeenCalledTimes(1);
  });
});
