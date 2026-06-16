const { withAndroidStyles, AndroidConfig } = require("expo/config-plugins");

/**
 * Expo Config Plugin to set the Android colorAccent to black (#000000).
 * This allows native Material elements (like the clock/calendar date picker dialog)
 * to use a black accent color instead of the default green/blue.
 */
function withBlackAccentColor(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(
      config.modResults,
      {
        add: true,
        parent: AndroidConfig.Styles.getAppThemeGroup(),
        name: "colorAccent",
        value: "#000000",
      },
    );
    return config;
  });
}

module.exports = withBlackAccentColor;
