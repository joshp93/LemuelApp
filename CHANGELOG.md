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

## [1.2.0] - 2026-10-24

### Added

- A four-step onboarding flow for first-time users: a welcome screen, a home
  screen tour with the daily reminder choice, a live meditation preview, and the
  account/community-notes introduction.
- Reminder setup from onboarding opens Settings full screen with a guided
  reminder-card highlight and a fixed Done action.

### Changed

- First launch now shows onboarding instead of the daily-reminder dialog. The
  old dialog is retained in the codebase but is no longer mounted.

### Fixed

- The meditation capture button now sits above Android's navigation bar.
- The meditation proverb area now uses all available space above the capture
  button and scrolls when the text is too long.

## [1.1.2] - 2026-10-18

### Added

- A forgot-password flow from the sign-in screen: request a reset code, then
  choose a new password.
- A new-password screen for accounts whose password an administrator has reset.
  It answers Cognito's new-password challenge and continues to the page the
  user originally asked for.

### Fixed

- Notes, account records and account statistics can only be read or changed by
  their owner. The backend now takes the user from the sign-in token instead of
  the uuid in the URL.
- Saving a note no longer clears its reaction and reply counts.
- Two notes by the same author on the same proverb no longer share a list key,
  and a reply count only updates the note it belongs to.
- The web note editor now re-initialises when a different note is opened.
- Device registration no longer links a device token to an account; linking is
  done only through the authenticated device-token route.

## [1.1.1] - 2026-10-18

### Changed

- Android releases are submitted to the Play production track rather than the
  alpha track, so this is the first version to reach production users. The build
  itself is the same as 1.1.0.

## [1.1.0] - 2026-10-16

### Added

- A GitHub Actions release pipeline
  ([`.github/workflows/release.yml`](./.github/workflows/release.yml)) that
  tests, builds the Android app bundle, deploys the web build, submits to Google
  Play, and tags the release. Pull requests run the test gate only.
- The display is now held awake for the whole of a meditation, on Android and in
  the browser, so the proverb stays readable without the screen dimming. The lock
  is taken as soon as the meditation screen opens and released when the timer
  ends.
- Dialogs are drawn by the app rather than by Android: black, with white text and
  rounded corners, matching the rest of the app. This covers the reminders prompt
  on first launch, the unsaved-changes prompt and the delete confirmations.

### Changed

- The Android `versionCode` is now derived from the version
  (`major * 10000 + minor * 100 + patch`) rather than auto-incremented by EAS.
  `eas.json` sets `appVersionSource: "local"` and no longer auto-increments, so
  `package.json` is the single source of truth for the version.
- Submitting to Google Play now authenticates with the service account key stored
  on EAS servers; `eas.json` no longer points at a local key file, so no Play
  credential is present in the repository or in CI.
- Changing Bible version cross-fades the wording over half a second instead of
  blanking the page, on the home screen and in the note editor alike. The
  outgoing wording stays put until the incoming one has arrived, so the content
  below it never jumps.
- Reactions, replies, edits and deletes appear as soon as they are made rather
  than once the server has answered. Each is settled against the server
  afterwards and put back if the write failed, and a reply that could not be sent
  returns to the box instead of being lost.
- A reply you have just written carries your display name straight away, rather
  than staying anonymous until the server echoed it back.
- The note editor is no longer interrupted by a version change, and its box stays
  hidden until the first proverb request has settled.

### Fixed

- The meditation screen no longer let the display sleep while the device was in
  battery saver — the one case where the wake lock was skipped, and skipped
  without any record of it. A wake lock that cannot be taken is now reported to
  the remote log rather than failing silently.
- The reply menu no longer hides itself when it is reopened while still closing.

### Notes

- The wake lock is an Android window flag, so it needs no permission.
- The display name is read from the account record rather than the sign-in
  tokens, which costs one extra request per sign-in.

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

[Unreleased]: https://github.com/joshp93/LemuelApp/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/joshp93/LemuelApp/releases/tag/v1.2.0
[1.1.2]: https://github.com/joshp93/LemuelApp/releases/tag/v1.1.2
[1.1.1]: https://github.com/joshp93/LemuelApp/releases/tag/v1.1.1
[1.1.0]: https://github.com/joshp93/LemuelApp/releases/tag/v1.1.0
[1.0.0]: https://github.com/joshp93/LemuelApp/releases/tag/v1.0.0
