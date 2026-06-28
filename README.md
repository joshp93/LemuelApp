# Lemuel — A Daily Proverb App

Lemuel is a mobile app (Android & iOS) that brings you a new proverb every day. Read it, reflect on it, set reminders, and jot down your thoughts.

## What you can do

- **Daily proverb** — Each day a new proverb appears on the home screen. Choose from multiple Bible versions (KJV, NIV, ESV, etc.).
- **Home screen widget** (Android) — The day's proverb is always visible on your home screen, updating automatically.
- **Notifications** — Get a daily reminder to read the proverb. Choose a fixed time or a random window.
- **Meditation timer** — Focus on the proverb with a full-screen animated meditation experience. Afterward, capture your thoughts.
- **Notes & journaling** — Write rich-text notes for any proverb. See what others have written too (community notes).
- **Your account** — Sign up with email, track your stats (meditations completed, notes written).

## How it works

### Daily proverb flow

```mermaid
sequenceDiagram
    participant App
    participant API as Backend API
    participant DB as DynamoDB

    App->>API: GET /kjv?date=today
    API->>DB: Query daily-proverb
    DB-->>API: Proverb ref + citation
    API-->>App: { ref, proverb, citation }
    App->>App: Display in ProverbCard
    App->>App: Update home screen widget
```

### Authentication flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant API as Backend API
    participant Cognito

    User->>App: Enter email
    App->>API: POST /auth/check-user-exists
    API->>Cognito: AdminGetUser
    Cognito-->>API: exists true/false
    API-->>App: { exists }

    alt New user
        App->>User: Show sign-up form
        User->>App: Email + password
        App->>Cognito: SignUp
        Cognito-->>App: verification needed
        App->>User: Enter 6-digit code
        User->>App: Verification code
        App->>Cognito: ConfirmSignUp
        Cognito-->>App: confirmed
    else Returning user
        App->>User: Show sign-in form
        User->>App: Password
        App->>Cognito: InitiateAuth
        Cognito-->>App: IdToken, AccessToken, RefreshToken
    end

    App->>App: Store tokens in AsyncStorage
    App->>API: POST /accounts/{uuid}/create
    API->>DB: Create account record
```

### Push notification flow

```mermaid
sequenceDiagram
    participant Cron as EventBridge (6 AM)
    participant Lambda as choose-proverb
    participant DB as DynamoDB
    participant Stream as DynamoDB Stream
    participant FCM as Firebase FCM
    participant App

    Cron->>Lambda: Daily trigger
    Lambda->>DB: Pick random unused proverb
    Lambda->>DB: Write daily-proverb for tomorrow
    DB->>Stream: INSERT event
    Stream->>Lambda: Invoke push-daily-proverb
    Lambda->>DB: Query all device tokens
    Lambda->>FCM: Send silent push to all devices
    FCM-->>App: data: { type: "daily-proverb" }
    App->>App: Update widget
    App->>App: Schedule local notification
    App->>User: Notification at preferred time
```

### Notes & journaling flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant API as Backend API
    participant DB as DynamoDB

    User->>App: Complete meditation
    App->>User: "Capture your thoughts"
    User->>App: Tap to write note
    App->>API: GET /notes/users/{uuid}/{ref}
    API->>DB: Fetch existing note
    DB-->>API: Note or null
    API-->>App: Note content
    App->>User: Show rich text editor
    User->>App: Write note
    User->>App: Tap Save
    App->>API: POST /notes/users/{uuid}/{ref}
    API->>DB: Upsert note
    API-->>App: { success: true }

    Note over App: Home screen shows community notes
    App->>API: GET /notes/proverbs/{ref}
    API->>DB: Query all notes for proverb
    DB-->>API: [{ note, user, date }]
    API-->>App: Notes list
    App->>User: Display community notes
```

## Tech stack

- **React Native** with Expo SDK 56
- **TypeScript** 6.0
- **Expo Router** (file-based navigation)
- **AWS Cognito** (authentication)
- **AWS Lambda + API Gateway** (backend, managed separately)
- **Voltra** (Android widgets)
- **react-native-reanimated** + **@shopify/react-native-skia** (animations)

## Getting started

```bash
# Install dependencies
pnpm install

# Run on Android (requires a development build, not Expo Go)
pnpm android

# Run on iOS
pnpm ios
```

## Development scripts

| Command | What it does |
|---|---|
| `pnpm start` | Start Expo dev server |
| `pnpm android` | Run on Android emulator/device |
| `pnpm ios` | Run on iOS simulator |
| `pnpm test` | Run tests (Jest) |
| `pnpm lint` | Lint with Biome |
| `pnpm typecheck` | TypeScript type checking |

## Project status

All core features are complete and working. Future plans include adding privacy controls for notes (public/private).

_Questions or feedback? Open an issue on the repository._
