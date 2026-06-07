# Lemuel

A daily proverb app that displays a new proverb each day and encourages users to meditate on it.

## What the app does

- Fetches a daily proverb from an API and displays it in the app
- Shows a widget on the home screen with today's proverb (auto-updates daily)
- Schedules push notifications to remind the user to read the proverb of the day

## Ultimate Goals

- ✅ **Widget** - Home screen widget showing the Daily Proverb
- ✅ **Push Notifications** - Push notifications reminding users to meditate on the daily proverb
- Notes/comments system for personal reflections (public or private)

Backend is separate (AWS Lambda). API changes needed for features beyond the app's direct functionality.

## Development Guidelines

- Uses pnpm and TypeScript
- Check which shell / environment you are running in before starting to avoid wasted effort. for example if you're running in PowerShell you can't use grep
- Unit tests required
- Don't modify generated files (e.g., android folder - regenerated on build)
- Follow Expo documentation
- Avoid building/running unless asked; if needed, ask first
- Avoid running tests unless asked because this slows down the feedback loop
- Optimize imports

# Widget Implementation

The app displays a home screen widget showing today's proverb, automatically updating daily.

## Architecture

- **Voltra** - Provides Android widget support via Jetpack Compose Glance
- **FCM Silent Push** - Widget updates triggered via FCM data messages from the backend
- **Config** - Widget defined in app.json plugins

## Key Files

- `src/widgets/proverb-widget.tsx` - Widget component
- `src/widgets/index.tsx` - Widget registration
- `src/notifications/push-listener.ts` - FCM silent push handler (widget update + notification scheduling)
- `app.json` - Voltra plugin configuration

# Push Notifications

The app uses FCM silent push (data messages) to trigger daily updates. When `choose-proverb` writes tomorrow's proverb in the backend DynamoDB table, a Lambda sends an FCM data message to all registered devices. The app's `NOTIFICATION_DATA_RECEIVED` background handler fetches the proverb, updates the home screen widget, and schedules local notifications at the user's configured time.

Users can configure when notifications are sent via two modes:

- **Random time within a window** — Choose a start and end hour; the notification fires at a random time within that window each day.
- **Specific time** — Choose an exact hour and minute; the notification fires at that time every day.

Preferences are persisted in AsyncStorage. Push token registration is handled via `POST /push/register-token` on the backend.

## Key Files
- `src/notifications/daily-proverb-notification.ts` — Scheduling logic (`scheduleProverbNotification`, `resolveScheduleDate`, `getRandomTimeInWindow`).
- `src/notifications/push-listener.ts` — FCM background handler, `NOTIFICATION_DATA_RECEIVED` task, token change listener.
- `src/notifications/notification-preferences.ts` — Preference storage (`notification_mode`, `random_window_start`, `random_window_end`, `scheduled_time_hour`, `scheduled_time_minute`).
- `src/api/push-token.ts` — Registers the FCM device token with the backend.
- `app/settings.tsx` — Settings UI with animated accordion sections and notification toggle.

# Daily Proverbs

The app fetches the proverb of the day from a remote API.

## Key Files
- `src/hooks/useProverbForTheDay.ts` - Hook for fetching the proverb of the day.
- `src/api/proverbs.ts` - API client for fetching proverbs.
- `src/components/proverb-card.tsx` - Component for displaying a proverb.
- `src/models/proverb.ts` - Proverb data model.

# Authentication Flow

The app uses AWS Cognito for authentication with SRP (Secure Remote Password) for sign-in and automatic token refresh.

## Overview

Authentication in the app follows this pattern:

1. **Sign Up** - User creates account with email/password
2. **Verify** - User confirms account with verification code
3. **Sign In** - Full SRP authentication flow with Cognito
4. **Token Storage** - Tokens stored in AsyncStorage
5. **Proactive Refresh** - Automatic token refresh before expiration
6. **Silent Sign-out** - Clear tokens on refresh failure (no redirect)

## Sign-In Flow (SRP)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Cognito

    User->>App: Enters email/password
    App->>Cognito: InitiateAuth (SRP_A)
    Cognito-->>App: SRP_B, salt, secret_block
    App->>App: Compute session key & signature
    App->>Cognito: RespondToAuthChallenge (signature)
    Cognito-->>App: IdToken, AccessToken, RefreshToken
    App->>App: Store tokens in AsyncStorage
    App->>User: Sign-in successful
```

### Key Points

- **SRP (Secure Remote Password)** - Password never sent to server
- **Three tokens returned**:
  - `IdToken` - Contains user identity (userId, email)
  - `AccessToken` - Short-lived (~1 hour), used for API calls
  - `RefreshToken` - Long-lived (~30 days), used to get new tokens
- Uses `USER_SRP_AUTH` flow in Cognito

## Token Refresh Flow

The app automatically refreshes tokens before they expire, both proactively (before API calls) and reactively (on 401 response).

```mermaid
sequenceDiagram
    participant App
    participant AsyncStorage
    participant Cognito

    App->>AsyncStorage: Get stored tokens
    AsyncStorage-->>App: IdToken, AccessToken, RefreshToken

    Note over App: Check if token expiring soon

    alt Token expired or expiring soon (< 5 min)
        App->>Cognito: InitiateAuth (REFRESH_TOKEN_AUTH + RefreshToken)
        Cognito-->>App: New IdToken, New AccessToken
        App->>AsyncStorage: Save new tokens (reuse RefreshToken)
    else Token still valid
        AsyncStorage-->>App: Return current token
    end
```

### Proactive Refresh Functions

Call these functions before making authenticated API calls:

- `getValidAccessToken()` - Returns valid access token, refreshes if needed
- `getValidIdToken()` - Returns valid ID token, refreshes if needed

### Silent Sign-Out

If refresh fails (e.g., refresh token expired):

1. Clear all tokens from AsyncStorage
2. Set user to null in AuthContext
3. App continues functioning (unauthenticated)
4. No redirect, no error message shown

## Key Files

| File                        | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `src/auth/auth-context.tsx` | React Context providing auth state to app     |
| `src/auth/token-storage.ts` | AsyncStorage read/write for tokens            |
| `src/auth/token-utils.ts`   | Token expiration checking utilities           |
| `src/api/auth.ts`           | Auth API functions (signIn, signOut, refresh) |
| `src/api/cognito.ts`        | Low-level Cognito SDK calls                   |

## Using Auth in Components

```typescript
// Get auth context
const { user, signOut, refreshToken } = useAuth();

// Get valid token before API call
const token = await auth.getValidAccessToken();

// Manual refresh (if needed)
const success = await refreshToken();
```

## Token Expiration Times

| Token Type    | Default Lifetime | Configurable |
| ------------- | ---------------- | ------------ |
| Access Token  | 1 hour           | Yes          |
| IdToken       | 1 hour           | Yes          |
| Refresh Token | 30 days          | Yes          |
