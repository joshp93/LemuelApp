# LemuelApp — Expo / React Native frontend

A daily proverb mobile app (Android + iOS) built with Expo SDK 56, React Native 0.85, and TypeScript 6.0.

## What the app does

- Fetches and displays a **daily proverb** from a remote API (multiple Bible versions)
- Shows a **home screen widget** (Android, via Voltra server-driven widgets with WorkManager). Updates every 60 minutes independently of the app, or on-demand when the app launches via `reloadWidgets`. The widget endpoint is unauthenticated and rate-limited at the API Gateway level.
- Schedules **push notifications** at configurable times (random window or exact time) via `expo-notifications`, with sent-date deduplication to prevent duplicates
- Provides a **meditation timer** with Skia-animated full-screen experience (nebula shader, progress arc), adapting shader complexity to device performance tier
- Supports **rich-text notes/journaling** per proverb (viewable as community notes)
- User **authentication** via AWS Cognito with automatic token refresh

## Project structure

```
app/                          # Expo Router pages (file-based routing)
  _layout.tsx                 # Root layout: fonts, auth provider, notifications init, stack nav
  index.tsx                   # Home: daily proverb, community notes, date nav, "Start Meditation"
  email-entry.tsx             # First auth screen: email input, checks user existence
  sign-in.tsx                 # Password entry, Cognito auth
  sign-up.tsx                 # Email + password registration
  confirm-sign-up.tsx         # 6-digit verification code entry
  settings.tsx                # Notification mode (random/scheduled), meditation duration
  meditation.tsx              # Full-screen Skia-animated meditation experience
  account.tsx                 # Authenticated user profile (email, stats)
  notes/
    users/
      [uuid].tsx              # My Meditations: list of user's notes (auth-guarded)
      [uuid]/[ref].tsx        # Note editor: rich text (react-native-pell-rich-editor)

src/
  api/                        # API clients (proverbs, auth, notes, account, meditation, push-token, remote-logger, available-versions, daily-proverbs, version-storage)
  auth/                       # Cognito auth: context, token storage, token utils, with-auth HOC
  components/                 # Reusable UI: proverb-card, proverb-note-card, reaction-bar, reply-thread, reply-card, reply-input, header-menu, themed-text, lemuel-button, time-picker, month-picker, version-dropdown, fade-in-down, dividing-line, error-boundary, expandable-section
  hooks/                      # useProverbForTheDay, useSettingsPreferences, useFitFontSize, useUnsavedChanges, useDeviceTier
  models/                     # Zod schemas: proverb, daily-proverb
  notifications/              # Scheduling logic, preference storage, FCM push listener
  settings/                   # Meditation preferences (AsyncStorage)
  utils/                      # date, email, password, format, proverb-helper
  widgets/                    # Voltra Android widget
    proverb-widget.tsx         # Widget UI component (VoltraAndroid JSX)
    proverb-widget-initial.tsx # Pre-rendered initial state (shown before first server fetch)
    initializeWidget.ts        # Sets server credentials + triggers immediate refresh on app launch
    index.tsx                  # legacy updateProverbWidget (client-side push, kept for reference)
  constants/
    theme.ts

__tests__/                    # Jest + @testing-library/react-native tests
```

## Features

| Feature | What it does | Key files |
|---|---|---|
| Daily proverb display | Fetches and shows a proverb from the selected Bible version, with pull-to-refresh and date navigation | `src/hooks/useProverbForTheDay.ts`, `src/api/proverbs.ts`, `src/components/proverb-card.tsx` |
| Multiple Bible versions | Stores the user's chosen version in AsyncStorage and re-fetches on change | `src/api/available-versions.ts`, `src/api/version-storage.ts`, `src/components/version-dropdown.tsx` |
| Monthly proverb calendar | Browse past proverbs by tapping a date on a month grid | `src/api/daily-proverbs.ts`, `src/components/month-picker.tsx` |
| Home screen widget (Android) | Voltra server-driven widget fetched via WorkManager every 60 min, with a pre-rendered loading state | `src/widgets/proverb-widget.tsx`, `src/widgets/initializeWidget.ts`, `src/widgets/proverb-widget-initial.tsx` |
| Push notifications | Configurable daily reminders (fixed time or random window) with sent-date deduplication to prevent duplicates, serialized concurrent scheduling | `src/notifications/daily-proverb-notification.ts`, `src/notifications/notification-preferences.ts`, `src/notifications/push-listener.ts` |
| Authentication (Cognito) | Email-based sign-up/sign-in with IdToken/AccessToken/RefreshToken stored in AsyncStorage, proactive refresh before expiry, reactive refresh on 401, silent sign-out on failure | `src/auth/auth-context.tsx`, `src/auth/token-storage.ts`, `src/auth/token-utils.ts`, `src/api/auth.ts`, `src/api/cognito.ts` |
| Notes system | Rich-text journaling per proverb via pell editor, displayed as community notes on the home screen | `src/api/notes.ts`, `src/components/proverb-note-card.tsx`, `app/notes/users/[uuid]/[ref].tsx`, `app/notes/users/[uuid].tsx` |
| Comment reactions & replies | Emoji reactions, threaded replies on notes, inline reply input | `src/api/notes.ts`, `src/components/reaction-bar.tsx`, `src/components/reply-thread.tsx`, `src/components/reply-card.tsx`, `src/components/reply-input.tsx` |
| Meditation timer | Full-screen Skia-animated experience (nebula shader, progress arc), shader complexity adapts to device performance tier | `app/meditation.tsx`, `src/api/meditation.ts`, `src/settings/meditation-preferences.ts`, `src/hooks/useDeviceTier.ts` |
| Account management | Authenticated user profile with email and meditation/note stats | `app/account.tsx`, `src/api/account.ts` |
| Logging | Remote logging via API for diagnostics | `src/api/remote-logger.ts` |

**Notes on notes system**: Notes can be created per-proverb via the rich-text editor. Community notes are displayed on the home screen for each proverb. Privacy/public toggle is not yet implemented (all notes are effectively visible to all users).

## Development guidelines

- **Package manager**: pnpm
- **Scripts**: `pnpm start`, `pnpm android`, `pnpm ios`, `pnpm test`, `pnpm lint`, `pnpm typecheck`
- **Testing**: Jest with `@testing-library/react-native`. Tests live in `__tests__/` mirroring the source tree.
- **Linting**: Biome (`pnpm lint`) + ESLint (`pnpm lint:eslint`)
- **Typecheck**: `pnpm typecheck` (tsc --noEmit)
- **Pre-test**: `pnpm pretest` runs typecheck + lint + eslint
- **Do NOT** modify `android/` — it's regenerated on prebuild
- **Do NOT** build/run the app unless asked
- **Do NOT** use Expo Go — native plugins (Voltra, notifications) require a dev build
- Detect the OS shell before running commands (PowerShell on Windows — no `grep`)

## Server-driven widget architecture

The proverb widget (`proverb_widget`) is a [Voltra server-driven widget](https://www.use-voltra.dev/v1/android/development/server-driven-widgets). It does **not** use `updateAndroidWidget()` for production updates — that was replaced by WorkManager-based background fetching.

**How it works:**

1. `app.config.ts` configures `serverUpdate.url` pointing at `GET /widgets/render` on the backend, with `intervalMinutes: 60` and `refresh: true` (provides a native refresh button).
2. The Voltra Expo plugin generates a `VoltraWidgetUpdateWorker` + `VoltraWidgetUpdateScheduler` that run independently of the app process via Android WorkManager.
3. On **app launch**, `initializeWidget()` in `src/widgets/initializeWidget.ts` calls `reloadAndroidWidgets(["proverb_widget"])` to trigger an immediate server fetch. No credentials are required — the widget endpoint is unauthenticated.
4. WorkManager sends `X-Bible-Version` header to the backend, receives Voltra JSON, and pushes `RemoteViews` to `AppWidgetManager`.
5. Before the first server fetch, the pre-rendered initial state (`proverb-widget-initial.tsx`) shows "Lemuel — Loading your daily proverb...".

**Key files:**

| File | Role |
|---|---|
| `app.config.ts` | Expo config with `serverUpdate` URL |
| `src/widgets/initializeWidget.ts` | Triggers immediate widget refresh on app launch |
| `src/widgets/proverb-widget.tsx` | Widget UI (mirrored server-side in `proverbWidget.tsx`) |
| `src/widgets/proverb-widget-initial.tsx` | Pre-rendered placeholder |
| `app/_layout.tsx:82-87` | Calls `initializeWidget` on mount |

**Removed**: The old `updateProverbWidget()` call in `app/index.tsx` (useEffect on proverb), and the `updateProverbWidget` call in `push-listener.ts:213` (background fetch / FCM push handler). These were non-functional because the OS-gated `expo-background-task` couldn't reliably push widget updates. The widget is now purely server-driven.

## Auth flow

1. User enters email → `checkUserExists` → routes to sign-in or sign-up
2. Sign-up → Cognito account creation → verification code screen
3. Sign-in → Cognito auth → IdToken, AccessToken, RefreshToken stored in AsyncStorage
4. Proactive token refresh (before expiry) + reactive refresh (on 401)
5. Silent sign-out on refresh failure (tokens cleared, user set to null, no redirect)

## API base URL

`https://vua1tbtwtd.execute-api.eu-west-2.amazonaws.com/prod`
