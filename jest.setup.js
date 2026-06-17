jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock("./src/api/remote-logger");

jest.mock("expo-device-corner-radius", () => ({
  getCornerRadius: jest.fn(() => 0),
}));
