const { defineConfig } = require("eslint/config");
const hooks = require("eslint-plugin-react-hooks");

module.exports = defineConfig([
  {
    ignores: ["dist/*", "widgets/**/*"],
  },
  hooks.configs.flat.recommended,
  {
    plugins: {
      expo: require("eslint-plugin-expo"),
    },
    rules: {
      "expo/no-dynamic-env-var": "error",
      "expo/no-env-var-destructuring": "error",
      "expo/use-dom-exports": "error",
    },
  },
]);
