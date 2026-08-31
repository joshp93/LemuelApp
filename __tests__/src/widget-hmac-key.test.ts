const mockConstants = {
  expoConfig: {
    extra: {
      widgetServerHmacKey: undefined as string | undefined,
    },
  },
};

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: mockConstants,
}));

describe("getWidgetHmacKey", () => {
  let getWidgetHmacKey: () => string;

  beforeEach(() => {
    jest.resetModules();
    mockConstants.expoConfig = {
      extra: { widgetServerHmacKey: undefined },
    };

    ({ getWidgetHmacKey } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../../src/widgets/getWidgetHmacKey"));
  });

  it("returns the key when present", () => {
    mockConstants.expoConfig.extra.widgetServerHmacKey = "my-secret-key";

    expect(getWidgetHmacKey()).toBe("my-secret-key");
  });

  it("throws when the key is undefined", () => {
    expect(() => getWidgetHmacKey()).toThrow(
      "[WidgetCredentials] widgetServerHmacKey is missing",
    );
  });

  it("throws when the key is an empty string", () => {
    mockConstants.expoConfig.extra.widgetServerHmacKey = "";

    expect(() => getWidgetHmacKey()).toThrow(
      "[WidgetCredentials] widgetServerHmacKey is missing",
    );
  });

  it("throws when extra is missing", () => {
    delete (mockConstants.expoConfig as Record<string, unknown>).extra;

    expect(() => getWidgetHmacKey()).toThrow(
      "[WidgetCredentials] widgetServerHmacKey is missing",
    );
  });

  it("throws when expoConfig is missing", () => {
    delete (mockConstants as Record<string, unknown>).expoConfig;

    expect(() => getWidgetHmacKey()).toThrow(
      "[WidgetCredentials] widgetServerHmacKey is missing",
    );
  });
});
