# LemuelApp — Expo / React Native frontend

A daily proverb app built with Expo SDK 56, React Native 0.85 and TypeScript 6.0.
One codebase ships to **Android** and **web**; the backend is a separate AWS CDK
project.

---

## Supported platforms — read this first

**Android and web are both first-class, supported targets, and every change must
be made with both in mind.**

A change that only works on one platform is an unfinished change. Before you call
anything done, ask yourself what it does on the other platform, and say so
explicitly when a feature is genuinely platform-limited (the widget and push
notifications are the sanctioned examples).

- **Android** — the primary mobile experience, run as a **development build**
  (`pnpm android`). Native modules in play: Voltra widgets, `expo-notifications`,
  `expo-background-task`, `react-native-keyboard-controller`,
  `react-native-pell-rich-editor`, Skia.
- **Web** — a statically exported React Native Web app (`web.output: "static"` in
  `app.config.ts`), run with `pnpm web`. No native modules; Skia runs on CanvasKit
  WASM.
- **iOS** — scaffolded in `app.config.ts` and `package.json`. It is **not** a
  supported or verified target; never assume a change works there.

Prefer shared code. Reach for a platform-specific file only when the platforms
genuinely differ, and **keep the variants in sync**.

---

## What the app does

- Fetches and displays a **daily proverb** from the backend, across multiple
  Bible versions, with date navigation and a monthly calendar
- Schedules **daily reminders** (fixed time or a random window) with sent-date
  deduplication — Android only
- Shows a **home-screen widget** (Android, Voltra server-driven, refreshed every
  60 minutes by WorkManager independently of the app)
- Provides a **meditation timer** with a Skia-animated full-screen experience
  (nebula shader + progress arc) that adapts shader complexity to the device's
  performance tier
- Supports **rich-text notes/journaling** per proverb, shown to everyone as
  community notes, with **emoji reactions** and **threaded replies**
- **Authentication** via AWS Cognito with automatic token refresh and an
  auth-guarded route HOC
- **Account management**: display name, meditation/note stats, account deletion
- **Remote logging** to the backend for diagnostics

---

## Platform-specific code

Metro picks the right file automatically:

| File | Used by |
|---|---|
| `X.tsx` | fallback / native default |
| `X.native.tsx` | Android and iOS |
| `X.web.tsx` | web |

**A `.web.tsx` or `.native.tsx` variant must have a plain `X.tsx` fallback
sibling**, or Metro fails to resolve it.

### Current variants

| Concern | Native | Web |
|---|---|---|
| Sign in | `src/screens/sign-in.tsx` | `src/screens/sign-in.web.tsx` |
| Settings | `src/screens/settings.tsx` | `src/screens/settings.web.tsx` |
| Meditation | `src/screens/meditation.tsx` | `src/screens/meditation.web.tsx` |
| Note editor | `src/components/note-editor.native.tsx` | `src/components/note-editor.web.tsx` |
| Scheduling + notifications | `src/notifications/daily-proverb-notification.ts` | `.web.ts` (no-ops) |
| Push / background tasks | `src/notifications/push-listener.ts` | `.web.ts` (no-ops) |
| Device token | `src/api/push-token.ts` | `.web.ts` (no-op) |
| Dialog primitives | `src/utils/dialog.ts` | `.web.ts` |
| Confirm helper | `src/utils/confirm.ts` | `.web.ts` |
| Widget bootstrap | `src/widgets/initializeWidget.android.ts` | `initializeWidget.ts` (no-op) |

Every route file in `app/` is a thin, platform-agnostic export — the variants
live under `src/` (see trap 3).

`src/widgets/initializeWidget.android.ts` deliberately inverts the usual
convention: the **`.android.ts` file is the real one** and the plain
`initializeWidget.ts` is the no-op fallback used everywhere else. The real
implementation lives in `widget-service.tsx`, which imports
`@use-voltra/android-client` — that package is only ever pulled in through the
Android variant, so it never reaches the web bundle.

### Three traps to remember

1. **TypeScript does not resolve platform extensions.** `tsc` resolves `./x` to
   `x.ts` only; Metro resolves `x.web.ts`. A named export that exists in the
   native variant but is missing from the web variant **is not a type error** —
   it is `undefined` at runtime on web. This has already caused a real bug (a
   `CONTENT_INSET` import that silently became `NaN` and dropped a padding on
   web), which is why `src/constants/layout.ts` is now a **single file** using
   `Platform.select` for its one platform-varying value instead of a
   `.ts`/`.web.ts` pair.
   → Keep platform-invariant values in one shared module. When you must split a
   module, diff the exports of both variants.
2. **Jest resolves to the native/default variant too.** To test a web module,
   import the `.web` path explicitly (e.g.
   `import { showDialog } from "../../src/utils/dialog.web"`). Tests must not
   rely on importing `./sibling` from inside a `.web` file expecting the web
   variant — import `./sibling.web` explicitly when that matters (see
   `src/utils/confirm.web.ts`).
3. **Never put a platform variant in `app/`.** expo-router builds its route
   table with `require.context` over `app/`, and that context matches platform
   variants such as `meditation.web.tsx` on **every** platform. expo-router
   filters them out of the route tree (a `.web` route is never routed on
   Android), but there is **no option to exclude a file from that context** — so
   Metro still resolves and bundles its imports. A web-only dependency in a
   web-only route file therefore breaks the *native* build: Skia's web build
   imports CanvasKit, which imports Node's `fs`, and that is exactly what broke
   the Android bundle.
   → Keep platform variants in `src/` and make the route file a thin,
   platform-agnostic export:

   ```tsx
   // app/meditation.tsx
   export { default } from "../src/screens/meditation";
   ```

   Metro's platform resolution then picks `src/screens/meditation.web.tsx` on
   web and `src/screens/meditation.tsx` on native, and the web-only code never
   enters the native graph. The same applies to components — `note-editor.*`
   lives in `src/components/` for this reason.

### Metro configuration

`metro.config.js` polyfills `buffer`, `util` and `stream-browserify` through
`resolver.extraNodeModules`, because `src/api/cognito.ts` runs
`@aws-sdk/client-cognito-identity-provider` inside the app. That is the only
custom resolution it does — platform separation comes from file naming (trap 3
above).

---

## Web rules and gotchas

1. **Never use `Alert` / `Alert.alert`.** react-native-web's `Alert` is a
   literal no-op, so an alert silently does nothing — and anything that calls
   `preventDefault()` before showing one will dead-end the UI. Use
   `showDialog` / `notify` from `src/utils/dialog.ts` or `confirm` from
   `src/utils/confirm.ts`. `Alert` should appear in exactly one place: the native
   implementation in `src/utils/dialog.ts`.
2. **Browser dialogs are limited.** `window.alert` has one button and
   `window.confirm` has two, unlabelled. `showDialog` on web therefore uses
   `confirm` for a two-choice dialog and a **sequence of confirms** for three or
   more choices; the `style: "cancel"` action is the outcome if every
   confirmation is declined.
3. **The web build statically renders every route.** `expo-router` evaluates
   route modules at build time, so **no `window` / `document` / native-only
   import at module scope**, and guard browser APIs (`typeof window`).
4. **`Modal` is fine.** react-native-web portals it to `document.body` with
   `position: fixed`, so a `Modal` always fills the viewport — use it for
   full-screen overlays rather than an `absoluteFill` view, which is constrained
   by the page's content column.
5. **Skia needs CanvasKit.** On web the WASM bundle is fetched asynchronously
   from the jsDelivr CDN and the canvas is mounted through `WithSkiaWeb` with a
   fallback. Don't import `meditation-canvas` directly on web.
6. **Notifications, push and the widget are no-ops on web.** Their `.web.ts`
   variants exist so shared code can import them unconditionally. The web
   settings page states this rather than showing dead controls.
7. **Keep web perf in mind.** Avoid heavy work at module scope and prefer the
   shared, already-memoised hooks.

---

## Web content layout

All pages share one layout system, configured centrally in `app/_layout.tsx`:

- `MAX_CONTENT_WIDTH = 1024` — the content column.
- `CONTENT_INSET = 16` — the padding between page content and its column edge.
  Every page applies it on **both** platforms.
- `CONTENT_COLUMN` — caps and centres a page's column. Apply it to the page's
  **scroll content** (`contentContainerStyle`), never to the scroll container, or
  the scroll bar moves inside the gutter instead of staying at the viewport edge.
- `getContentGutter(windowWidth)` (`src/utils/layout.ts`) — the space either side
  of the column; the web header uses it to inset its own content.
- Page backgrounds and the header bar still fill the **full viewport width** on
  wide screens; only the content inside is constrained.
- `CONTENT_COLUMN` is `{}` and `contentGutter` is `0` on native, so the column
  and the gutter are web-only. The **header inset is web-only too**: the native
  header already insets its own trailing control, so `app/_layout.tsx` only
  wraps the burger menu with `contentGutter + CONTENT_INSET` on web. Adding it
  on native double-pads the burger.

---

## Project structure

```
app/                          # Expo Router routes — thin, platform-agnostic files
  _layout.tsx                 # Fonts, auth provider, notification init, stack nav,
                              # web content frame (gutters + background)
  index.tsx                   # Home: daily proverb, community notes, date nav
  email-entry.tsx             # First auth screen: email, checks user existence
  sign-in.tsx                 # → src/screens/sign-in
  sign-up.tsx                 # Email + password + display name
  confirm-sign-up.tsx         # 6-digit verification code
  settings.tsx                # → src/screens/settings
  meditation.tsx              # → src/screens/meditation
  account.tsx                 # Profile, stats, display name, delete account
  notes/
    users/[uuid].tsx          # "My Meditations" list (auth-guarded, searchable)
    users/[uuid]/[ref].tsx    # Note editor page (rich text, private flag, delete)

src/
  api/            # account, auth, cognito, proverbs, available-versions,
                  # daily-proverbs, notes (notes + reactions + replies), meditation,
                  # push-token, remote-logger, version-storage, constants (base URL)
  auth/           # auth-context, token-storage, token-utils, with-auth HOC
  components/     # bottom-sheet-menu, dividing-line, error-boundary,
                  # expandable-section, fade-in-down, header-menu, lemuel-button,
                  # lemuel-keyboard-avoiding-view, lemuel-keyboard-aware-scroll-view,
                  # meditation-canvas, month-picker, not-today-banner,
                  # note-editor-loading, proverb-card, proverb-note-card,
                  # proverb-reference-header-text, reaction-bar, reply-card,
                  # reply-input, reply-thread, themed-text, time-picker,
                  # version-dropdown
  constants/      # theme (colours), layout (content width/inset/column),
                  # meditation (shared shader constants)
  hooks/          # useProverbForTheDay, useSettingsPreferences, useFitFontSize,
                  # useUnsavedChanges, useDeviceTier
  models/         # Zod schemas + response types (proverb, daily-proverb,
                  # reactions-and-replies)
  notifications/  # daily-proverb-notification (+ .web), notification-preferences,
                  # notification-utils (shared pure helpers), push-listener (+ .web)
  screens/        # Screens that differ per platform: sign-in, settings, meditation
                  # (each with a .tsx and a .web.tsx sibling)
  settings/       # meditation-preferences (duration + duration options)
  utils/          # auth-redirect, battery-optimization, confirm (+ .web), date,
                  # dialog (+ .web), email, format, layout, meditation-shader,
                  # password, proverb-helper
  widgets/        # Voltra Android widget (see below)

plugins/          # Expo config plugins
  withBlackAccentColor.js       # Android accent colour
  with-unique-notification-ids.js  # Gives each notification a distinct Android ID
config/           # cognito.ts (user pool + client id), cognito.example.ts template
__tests__/        # Jest tests mirroring the source tree
```

---

## Features

| Feature | What it does | Platforms | Key files |
|---|---|---|---|
| Daily proverb | Fetches and shows a proverb for a date from the selected Bible version, with pull-to-refresh | Android + web | `src/hooks/useProverbForTheDay.ts`, `src/api/proverbs.ts`, `src/components/proverb-card.tsx` |
| Multiple Bible versions | Stores the chosen version in AsyncStorage and re-fetches on change | Android + web | `src/api/available-versions.ts`, `src/api/version-storage.ts`, `src/components/version-dropdown.tsx` |
| Monthly calendar | Browse past proverbs by tapping a date on a month grid | Android + web | `src/api/daily-proverbs.ts`, `src/components/month-picker.tsx` |
| Authentication | Email-based sign-up/sign-in with IdToken/AccessToken/RefreshToken in AsyncStorage, proactive refresh before expiry, reactive refresh on 401, silent sign-out on failure | Android + web | `src/auth/*`, `src/api/auth.ts`, `src/api/cognito.ts` |
| Auth-guarded routes | `withAuth` HOC redirects to `/email-entry?redirect=…&route=…`, replacing dynamic `[uuid]` segments with `{{uuid}}` so they resolve after login | Android + web | `src/auth/with-auth.tsx`, `src/utils/auth-redirect.ts` |
| Meditation timer | Full-screen Skia animation (nebula shader + progress arc), shader complexity adapts to device tier, records completion | Android + web (CanvasKit on web) | `app/meditation.tsx` / `.web.tsx`, `src/components/meditation-canvas.tsx`, `src/utils/meditation-shader.ts`, `src/constants/meditation.ts`, `src/hooks/useDeviceTier.ts` |
| Notes | Rich-text journaling per proverb (pell editor on native, `contentEditable` on web), with a private flag and delete | Android + web | `src/api/notes.ts`, `app/notes/users/[uuid]/[ref].tsx`, `note-editor.*` |
| Community notes | All users' notes for a proverb are shown on the home screen | Android + web | `src/components/proverb-note-card.tsx`, `src/api/notes.ts` |
| Reactions & replies | Emoji reactions and threaded replies on notes | Android + web | `src/components/reaction-bar.tsx`, `reply-thread.tsx`, `reply-card.tsx`, `reply-input.tsx`, `src/api/notes.ts` |
| Account management | Display name editing, account stats, delete account | Android + web | `app/account.tsx`, `src/api/account.ts` |
| Daily reminders | Fixed time or random window, sent-date deduplication, reply notification category, background re-scheduling | **Android only** | `src/notifications/daily-proverb-notification.ts`, `push-listener.ts`, `notification-preferences.ts` |
| Home-screen widget | Voltra server-driven widget, refreshed hourly by WorkManager with a pre-rendered loading state | **Android only** | `src/widgets/widget-service.tsx`, `initializeWidget.android.ts` |
| Battery optimisation | Opens the Android battery-optimisation settings, with an explanatory warning in Settings | **Android only** | `src/utils/battery-optimization.ts` |
| Cross-platform dialogs | Promise-based `showDialog` / `confirm` / `notify` that work on both platforms | Android + web | `src/utils/dialog.ts` (+ `.web.ts`), `src/utils/confirm.ts` (+ `.web.ts`) |
| Web content frame | Caps and centres page content at 1024px with full-width backgrounds and viewport-edge scroll bars | **Web only** | `app/_layout.tsx`, `src/constants/layout.ts`, `src/utils/layout.ts` |
| Remote logging | Fire-and-forget logging to `POST /logs` | Android + web | `src/api/remote-logger.ts` |

**Notes on the notes system**: notes are created per-proverb with the rich-text
editor and displayed as community notes. The **private flag is stored and shown
in the editor but is not enforced** — every note is currently visible to
everyone.

---

## Development guidelines

- **Package manager**: pnpm
- **Scripts**: `pnpm web`, `pnpm android`, `pnpm start`, `pnpm test`,
  `pnpm typecheck`, `pnpm lint`, `pnpm lint:fix`, `pnpm lint:eslint`,
  `pnpm format`, `pnpm emulator`
- **Typecheck**: `pnpm typecheck` (`tsc --noEmit`)
- **Linting**: Biome (`pnpm lint`) **and** ESLint (`pnpm lint:eslint`) — both must
  pass
- **Pre-test**: `pnpm pretest` runs `typecheck → biome → eslint` before Jest, so
  `pnpm test` is the single gate for everything
- **Do NOT** modify `android/` — it is regenerated by `expo prebuild`
- **Do NOT** build or run the app unless asked
- **Do NOT** use Expo Go — the native plugins (Voltra, notifications,
  background-task) require a development build
- Detect the OS shell before running commands (the dev machine is Windows, so
  PowerShell — no `grep`)
- New functions and components get concise TSDoc; new behaviour gets unit tests

### Testing

- Jest with `jest-expo`, plus `@testing-library/react-native`. Tests live in
  `__tests__/`, mirroring the source tree.
- The test environment is **not** a browser: there is no `window` or `document`.
  Web modules must therefore be defensive (`typeof window === "undefined"`), and
  tests stub the globals they need (`globalThis.window = { … }`).
- `jest-expo` resolves platform extensions to the **native/default** variant, so
  web implementations are tested by importing the `.web` file explicitly.
- `jest.setup.js` mocks AsyncStorage, the remote logger, the raw console,
  `react-native-keyboard-controller` and `react-native-safe-area-context`.

---

## Server-driven widget architecture

The `proverb_widget` is a [Voltra server-driven widget](https://www.use-voltra.dev/v1/android/development/server-driven-widgets).
It does **not** use `updateAndroidWidget()` for production updates — that was
replaced by WorkManager-based background fetching.

How it works:

1. `app.config.ts` configures the widget with `serverUpdate.url` pointing at
   `GET /widgets/render`, `intervalMinutes: 60` and `refresh: true` (a native
   refresh button), plus `initialStatePath` for the pre-rendered placeholder.
2. The Voltra Expo plugin generates a `VoltraWidgetUpdateWorker` and
   `VoltraWidgetUpdateScheduler` that run independently of the app via Android
   WorkManager.
3. On app launch, `initializeWidget()` (`src/widgets/initializeWidget.android.ts`)
   calls `reloadAndroidWidgets(["proverb_widget"])` for an immediate fetch. **No
   credentials are required** — the endpoint is unauthenticated and rate-limited
   at the API Gateway level.
4. WorkManager sends an `X-Bible-Version` header, receives Voltra JSON, and
   pushes `RemoteViews` to `AppWidgetManager`.
5. Before the first successful fetch, the pre-rendered initial state
   (`proverb-widget-initial.js`) shows "Lemuel" / "Loading your daily proverb…",
   and the live widget component falls back to "Please open the Lemuel app once
   to activate the widget." when no proverb is available.

Key files:

| File | Role |
|---|---|
| `app.config.ts` | Widget config (`serverUpdate`, size, initial state) |
| `src/widgets/widget-service.tsx` | Live implementation: `initializeWidget`, the widget UI and `updateProverbWidget` |
| `src/widgets/initializeWidget.android.ts` | Android entry point re-exporting the real `initializeWidget` |
| `src/widgets/initializeWidget.ts` | No-op fallback for web and iOS |
| `src/widgets/proverb-widget-initial.js` | Pre-rendered initial state (excluded from linting) |
| `src/widgets/proverb-widget.tsx`, `src/widgets/index.tsx` | Legacy/reference widget UI and client-side update helper — **not imported anywhere** |
| `app/_layout.tsx` | Calls `initializeWidget()` on mount |

---

## Auth flow

1. User enters an email → `checkUserExists` → routes to sign-in or sign-up
2. Sign-up → Cognito account creation → verification code screen
3. Sign-in → Cognito auth → IdToken, AccessToken, RefreshToken stored in
   AsyncStorage
4. Proactive token refresh before expiry, plus reactive refresh on a 401
5. Silent sign-out on refresh failure (tokens cleared, user set to `null`, no
   redirect)
6. Protected routes use `withAuth`, which redirects to
   `/email-entry?redirect=<path>&route=<routeName>`; on a successful sign-in the
   web and native sign-in screens rebuild the original route with
   `buildRedirectResetAction` (`src/utils/auth-redirect.ts`)

---

## API

Base URL: `https://vua1tbtwtd.execute-api.eu-west-2.amazonaws.com/prod`
(`src/api/constants.ts`).

| Endpoint | Used for |
|---|---|
| `GET /{version}?date=` | Proverb for a date |
| `GET /available-versions` | Bible versions |
| `GET /get-proverbs?month=` | Monthly calendar |
| `POST /auth/check-user-exists` | Does this email have an account? |
| `GET/POST /accounts/{uuid}` | Account details, updates |
| `POST /accounts/{uuid}/create` | Create the account record after sign-in |
| `POST /accounts/{uuid}/device-tokens` | Register a device for push |
| `POST /accounts/{uuid}/meditations/{date}` | Record a completed meditation |
| `GET/PUT/DELETE /notes/users/{uuid}/{refKey}` | A user's note |
| `GET /notes/users/{uuid}` | All notes by a user |
| `GET /notes/proverbs/{refKey}?…` | Community notes for a proverb |
| `POST/DELETE …/reactions`, `GET …/reactions` | Emoji reactions |
| `POST/DELETE …/replies`, `GET …/replies` | Threaded replies |
| `POST /push/register-token` | Register/refresh an FCM token |
| `POST /logs` | Remote logging |
| `GET /widgets/render` | Voltra widget payload (called by WorkManager, not the app; unauthenticated + rate limited) |

The backend lives in a **separate AWS CDK repository** and is deployed
independently. CORS responses there are produced by a shared `formatResponse`
helper — if a web request fails with a CORS error, that is where to look.
