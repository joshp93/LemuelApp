# LemuelApp — Expo / React Native frontend

A daily proverb mobile app (Android + iOS) built with Expo SDK 56, React Native 0.85, and TypeScript 6.0.

## What the app does

- Fetches and displays a **daily proverb** from a remote API (multiple Bible versions)
- Shows a **home screen widget** (Android, via Voltra / Jetpack Compose Glance) that auto-updates daily via FCM silent push
- Schedules **push notifications** at configurable times (random window or exact time) via `expo-notifications`
- Provides a **meditation timer** with Skia-animated full-screen experience (nebula shader, progress arc)
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
  components/                 # Reusable UI: proverb-card, proverb-note-card, header-menu, themed-text, lemuel-button, time-picker, month-picker, version-dropdown, fade-in-down, dividing-line, error-boundary, expandable-section
  hooks/                      # useProverbForTheDay, useSettingsPreferences, useFitFontSize, useKeyboardHeight, useUnsavedChanges
  models/                     # Zod schemas: proverb, daily-proverb
  notifications/              # Scheduling logic, preference storage, FCM push listener
  settings/                   # Meditation preferences (AsyncStorage)
  utils/                      # date, email, password, format, proverb-helper
  widgets/                    # Voltra Android widget (proverb-widget.tsx)
  constants/
    theme.ts

__tests__/                    # Jest + @testing-library/react-native tests
```

## Features — Status

| Feature | Status | Key files |
|---|---|---|
| Daily proverb display | ✅ Complete | `src/hooks/useProverbForTheDay.ts`, `src/api/proverbs.ts`, `src/components/proverb-card.tsx` |
| Multiple Bible versions | ✅ Complete | `src/api/available-versions.ts`, `src/api/version-storage.ts`, `src/components/version-dropdown.tsx` |
| Monthly proverb calendar | ✅ Complete | `src/api/daily-proverbs.ts`, `src/components/month-picker.tsx` |
| Home screen widget (Android) | ✅ Complete | `src/widgets/proverb-widget.tsx`, `src/widgets/index.tsx` |
| Push notifications | ✅ Complete | `src/notifications/daily-proverb-notification.ts`, `src/notifications/notification-preferences.ts`, `src/notifications/push-listener.ts` |
| Authentication (Cognito) | ✅ Complete | `src/auth/auth-context.tsx`, `src/auth/token-storage.ts`, `src/auth/token-utils.ts`, `src/api/auth.ts`, `src/api/cognito.ts` |
| Notes system (rich text journaling) | ✅ Complete | `src/api/notes.ts`, `src/components/proverb-note-card.tsx`, `app/notes/users/[uuid]/[ref].tsx`, `app/notes/users/[uuid].tsx` |
| Meditation timer (Skia) | ✅ Complete | `app/meditation.tsx`, `src/api/meditation.ts`, `src/settings/meditation-preferences.ts` |
| Account management | ✅ Complete | `app/account.tsx`, `src/api/account.ts` |
| Logging | ✅ Complete | `src/api/remote-logger.ts` |

**Notes on notes system**: Notes can be created per-proverb via the rich-text editor. Community notes are displayed on the home screen for each proverb. Privacy/public toggle is not yet implemented (all notes are effectively visible to all users).

## Development guidelines

- **Package manager**: pnpm
- **Scripts**: `pnpm start`, `pnpm android`, `pnpm ios`, `pnpm test`, `pnpm lint`, `pnpm typecheck`
- **Testing**: Jest with `@testing-library/react-native`. Tests live in `__tests__/` mirroring the source tree.
- **Linting**: Biome (`pnpm lint`) + ESLint (`pnpm lint:eslint`)
- **Typecheck**: `pnpm typecheck` (tsc --noEmit)
- **Pre-test**: `pnpm pretest` runs typecheck + lint + eslint
- **Do NOT** run tests unless asked — it slows the feedback loop
- **Do NOT** modify `android/` — it's regenerated on prebuild
- **Do NOT** build/run the app unless asked
- **Do NOT** use Expo Go — native plugins (Voltra, notifications) require a dev build
- Detect the OS shell before running commands (PowerShell on Windows — no `grep`)

## Auth flow

1. User enters email → `checkUserExists` → routes to sign-in or sign-up
2. Sign-up → Cognito account creation → verification code screen
3. Sign-in → Cognito auth → IdToken, AccessToken, RefreshToken stored in AsyncStorage
4. Proactive token refresh (before expiry) + reactive refresh (on 401)
5. Silent sign-out on refresh failure (tokens cleared, user set to null, no redirect)

## API base URL

`https://vua1tbtwtd.execute-api.eu-west-2.amazonaws.com/prod`
