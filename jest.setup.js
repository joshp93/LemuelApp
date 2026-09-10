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

jest.mock("react-native-keyboard-controller", () => {
  const React = require("react");
  const RN = require("react-native");
  const { forwardRef } = React;

  const KeyboardAvoidingView = forwardRef(
    ({ style, children, ...props }, ref) =>
      React.createElement(RN.View, { ref, style, ...props }, children),
  );

  const KeyboardAwareScrollView = forwardRef(
    ({ style, children, contentContainerStyle, ...props }, ref) =>
      React.createElement(
        RN.ScrollView,
        { ref, style, contentContainerStyle, ...props },
        children,
      ),
  );

  const KeyboardProvider = ({ children }) => children;

  return {
    __esModule: true,
    KeyboardAvoidingView,
    KeyboardAwareScrollView,
    KeyboardProvider,
    KeyboardController: { setDefaultMode: jest.fn() },
    KeyboardEvents: { addListener: jest.fn() },
  };
});

jest.mock("react-native-safe-area-context", () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 0, height: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
  };
});
