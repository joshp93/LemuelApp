import {
  reloadAndroidWidgets,
  setWidgetServerCredentials,
} from "voltra/android/client";
import { getChosenVersion } from "../../src/api/version-storage";
import { getWidgetHmacKey } from "../../src/widgets/getWidgetHmacKey";
import { initializeWidget } from "../../src/widgets/initializeWidget";

jest.mock("voltra/android/client", () => ({
  setWidgetServerCredentials: jest.fn(),
  reloadAndroidWidgets: jest.fn(),
}));

jest.mock("../../src/api/version-storage", () => ({
  getChosenVersion: jest.fn(),
}));

const mockGetWidgetHmacKey = getWidgetHmacKey as jest.MockedFunction<
  typeof getWidgetHmacKey
>;

const mockSetCredentials = setWidgetServerCredentials as jest.MockedFunction<
  typeof setWidgetServerCredentials
>;
const mockReloadWidgets = reloadAndroidWidgets as jest.MockedFunction<
  typeof reloadAndroidWidgets
>;
const mockGetVersion = getChosenVersion as jest.MockedFunction<
  typeof getChosenVersion
>;

jest.mock("../../src/widgets/getWidgetHmacKey", () => ({
  getWidgetHmacKey: jest.fn(),
}));

describe("initializeWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetCredentials.mockResolvedValue(undefined);
    mockReloadWidgets.mockResolvedValue(undefined);
    mockGetWidgetHmacKey.mockReturnValue("test-hmac-key");
  });

  it("should set credentials with the hmacKey and chosen version", async () => {
    mockGetVersion.mockResolvedValue("kjv");

    await initializeWidget();

    expect(mockSetCredentials).toHaveBeenCalledWith({
      token: "test-hmac-key",
      headers: { "X-Bible-Version": "kjv" },
    });
  });

  it("should default version to niv when no version is stored", async () => {
    mockGetVersion.mockResolvedValue(null);

    await initializeWidget();

    expect(mockSetCredentials).toHaveBeenCalledWith({
      token: "test-hmac-key",
      headers: { "X-Bible-Version": "niv" },
    });
  });

  it("should reload the proverb_widget after setting credentials", async () => {
    mockGetVersion.mockResolvedValue("niv");

    await initializeWidget();

    expect(mockSetCredentials).toHaveBeenCalled();
    expect(mockReloadWidgets).toHaveBeenCalledWith(["proverb_widget"]);
  });

  it("should reload widgets after credentials are set", async () => {
    const callOrder: string[] = [];
    mockSetCredentials.mockImplementation(async () => {
      callOrder.push("credentials");
    });
    mockReloadWidgets.mockImplementation(async () => {
      callOrder.push("reload");
    });
    mockGetVersion.mockResolvedValue("niv");

    await initializeWidget();

    expect(callOrder).toEqual(["credentials", "reload"]);
  });
});
