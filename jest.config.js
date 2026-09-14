module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|voltra|react-native-keyboard-controller|@aws-sdk|@use-voltra)",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@aws-sdk/client-cognito-identity-provider$":
      "<rootDir>/jest-mocks/aws-sdk-stub.js",
  },
  collectCoverageFrom: ["app/**/*.{ts,tsx}", "!app/**/*.d.ts"],
};
