// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'widgets/**/*'],
    settings: {
      'import/resolver': {
        alias: {
          entries: [
            { find: 'expo-background-task', replacement: './node_modules/expo-background-task' },
            { find: 'expo-task-manager', replacement: './node_modules/expo-task-manager' },
          ],
        },
      },
    },
  },
]);
