# Changelog

All notable changes to Lemuel are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The version lives in `package.json` and nowhere else: `config/version.js` reads
it, and `app.config.ts` derives both `expo.version` and the Android
`versionCode` from it. Releases are cut by bumping that version and merging to
`main` — the pipeline tags `v<version>` once the build, the web deploy and the
Play submission have all succeeded.

## [Unreleased]

### Added

- A GitHub Actions release pipeline
  ([`.github/workflows/release.yml`](./.github/workflows/release.yml)) that
  tests, builds the Android app bundle, deploys the web build, submits to Google
  Play, and tags the release. Pull requests run the test gate only.

### Changed

- The Android `versionCode` is now derived from the version
  (`major * 10000 + minor * 100 + patch`) rather than auto-incremented by EAS.
  `eas.json` sets `appVersionSource: "local"` and no longer auto-increments, so
  `package.json` is the single source of truth for the version.
- Submitting to Google Play now authenticates with the service account key stored
  on EAS servers; `eas.json` no longer points at a local key file, so no Play
  credential is present in the repository or in CI.

## [1.0.0] - 2026-10-14

First public release.

### Added

- A daily proverb for the current date, with date navigation and a monthly
  calendar for browsing past entries.
- Multiple Bible versions, selectable in Settings and remembered across
  launches.
- A meditation timer: a full-screen Skia animation with a progress arc, where
  the shader complexity adapts to the device's performance tier. Five
  backgrounds are available, one of which is chosen at random per session.
- Rich-text notes per proverb, with a private flag and delete.
- Community notes — every user's notes for a proverb appear on the home screen.
- Emoji reactions and threaded replies on notes.
- Email-based authentication via AWS Cognito, with proactive refresh before
  expiry, reactive refresh on a 401, and a silent sign-out when refresh fails.
- Account management: display name, meditation and note statistics, and account
  deletion.
- Daily reminders, at a fixed time or within a random window, with sent-date
  deduplication — Android only.
- A server-driven home screen widget, refreshed hourly by WorkManager
  independently of the app — Android only.
- A battery-optimisation prompt in Settings, explaining why reminders need the
  exemption — Android only.
- Remote logging to the backend for diagnostics.

### Notes

- The web build ships the same daily proverb, meditation timer, notes and
  account management, with its own sign-in, settings, meditation and
  note-editing implementations. Reminders, push notifications and the widget are
  Android-only by nature, and the web settings page says so rather than showing
  dead controls.
- The note **private flag is stored and shown in the editor but is not
  enforced** — every note is currently visible to everyone. This is a known gap,
  not a regression.
- iOS is scaffolded in `app.config.ts` but is not a supported or verified
  target.

[Unreleased]: https://github.com/joshp93/LemuelApp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/joshp93/LemuelApp/releases/tag/v1.0.0
