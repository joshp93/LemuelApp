const { version } = require("../package.json");

/**
 * The application version, read from `package.json`.
 *
 * This is the single source of truth for the release version: `app.config.ts`
 * derives `expo.version` and the Android `versionCode` from it, and the release
 * workflow derives the git tag from it. Bumping `package.json` is therefore the
 * only version change a release needs.
 */
const APP_VERSION = version;

/** The largest value allowed for each part of a version that maps to a code. */
const MAX_VERSION_PART = 99;

/**
 * Converts a version into an Android `versionCode`.
 *
 * The encoding is `major * 10000 + minor * 100 + patch`, so `1.0.0` becomes
 * `10000` and `1.2.3` becomes `10203`. The result grows monotonically with the
 * version, which is what the Play Store requires of successive uploads.
 *
 * @param {string} value - A `major.minor.patch` version.
 * @returns {number} The Android `versionCode` for that version.
 * @throws {Error} If the version carries a prerelease or build suffix, is not a
 *   `major.minor.patch` triple, or has a part above 99.
 */
function toVersionCode(value) {
  if (/[-+]/.test(value)) {
    throw new Error(
      `Cannot derive an Android versionCode from "${value}": prerelease and build suffixes are not supported, because they would reuse the code of the final release.`,
    );
  }

  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!parts) {
    throw new Error(
      `Cannot derive an Android versionCode from "${value}": expected a major.minor.patch version.`,
    );
  }

  const [major, minor, patch] = parts.slice(1).map(Number);
  if (
    major > MAX_VERSION_PART ||
    minor > MAX_VERSION_PART ||
    patch > MAX_VERSION_PART
  ) {
    throw new Error(
      `Cannot derive an Android versionCode from "${value}": each part must be at most ${MAX_VERSION_PART}.`,
    );
  }

  return major * 10000 + minor * 100 + patch;
}

module.exports = { APP_VERSION, toVersionCode };
