# Mobile Architecture

The mobile app is an Expo-managed React Native application with Redux for state management and React Navigation for routing.

## Directory Structure

```
lrda_mobile/
├── App.tsx                    # Entry point (Redux + Theme + Context providers)
├── app.config.js              # Expo config (env vars, permissions)
├── types.ts                   # TypeScript types (Note, UserData)
├── redux/
│   ├── slice/
│   │   ├── navigationSlice.tsx    # Nav state (onboarding | login | home)
│   │   ├── themeSlice.tsx         # Theme color customization
│   │   └── addNoteStateSlice.tsx  # Note creation workflow
│   └── store/
│       └── store.tsx              # Redux store with redux-persist
├── lib/
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation structure (3 states + 5 tabs)
│   ├── screens/               # 21 screen components
│   │   ├── loginScreens/      # Login, Register, ForgotPassword
│   │   ├── mapPage/           # Map + detail modals
│   │   ├── HomeScreen.tsx     # User's own notes
│   │   ├── Library.tsx        # All published notes
│   │   ├── AddNoteScreen.tsx  # Rich text editor + media
│   │   ├── ProfilePage.tsx    # User account
│   │   └── ...
│   ├── components/            # 21 reusable UI components
│   ├── auth/
│   │   └── client.ts          # Better Auth client (session stored in SecureStore)
│   ├── stores/
│   │   └── authStore.ts       # Session state (Zustand)
│   ├── models/
│   │   └── media_class.ts     # Media type hierarchy
│   ├── utils/
│   │   ├── api_calls.ts       # RERUM API client
│   │   ├── S3_proxy.ts        # Media upload client
│   │   └── ...
├── assets/                    # Icons, fonts, splash screen
└── styles/
    └── globalStyles.ts        # Global style constants
```

## Navigation

The app uses a three-level conditional navigation pattern controlled by Redux:

**State 1 -- Onboarding** (first launch):
Onboarding tutorial screens, then routes to login

**State 2 -- Login** (unauthenticated):
Login, Register, and ForgotPassword screens

**State 3 -- Home** (authenticated):
Bottom tab navigator with 5 tabs:

| Tab | Screen | Description |
| --- | --- | --- |
| Home | HomeScreen (stack) | User's own notes with swipe actions |
| Library | Library | All published notes |
| Add Note | AddNoteScreen | Rich text editor (custom FAB button) |
| Map | ExploreScreen | Google Maps with note markers |
| More | MorePage (stack) | Settings, team, about, theme |

## State Management

- **Redux Toolkit** with 3 slices: `navigation`, `theme`, `addNoteState`
- **Redux Persist** with AsyncStorage for offline persistence
- **React Context** (`AddNoteContext`) for note publishing coordination between screens
- **authStore** (`lib/stores/authStore.ts`, Zustand) for Better Auth session state

## API Integration

The mobile app communicates with two external services:

### RERUM API
Base URL: `https://lived-religion-dev.rerum.io/deer-lr/`

| Function | Endpoint | Purpose |
| --- | --- | --- |
| `fetchMessages()` | `/query` | All notes (recursive pagination) |
| `fetchMessagesBatch()` | `/query` | User's notes (batch mode) |
| `writeNewNote()` | `/create` | Create note |
| `overwriteNote()` | `/overwrite` | Update note |
| `deleteNoteFromAPI()` | `/delete` | Delete note |
| `searchMessages()` | `/query` | Search by title/tags |

### S3 Proxy
Base URL: `http://s3-proxy.rerum.io/S3/`

Handles image, video, and audio uploads. Returns a `Location` header with the file URL. Platform-specific encoding (base64 for iOS, URI for Android).

## Authentication

Better Auth with email/password, via the website API (`AUTH_API_URL`). The client in `lib/auth/client.ts` uses `@better-auth/expo` to keep the session in SecureStore, and `lib/stores/authStore.ts` exposes:

- `login(email, password)` -- Sign in and store the session
- `logout()` -- Sign out and clear the session
- `initialize()` -- Restore an existing session on launch

## Key Differences from Web

| Aspect | Web | Mobile |
| --- | --- | --- |
| Backend | Hono API + PostgreSQL | Hono API + PostgreSQL |
| Auth | Better Auth (sessions) | Better Auth (Bearer token) |
| Rich text | Tiptap | tentap-editor + pell-rich-editor |
| Maps | `@react-google-maps/api` | `react-native-maps` |
| State | Zustand + React Query | Redux Toolkit + Redux Persist |
| Package manager | pnpm | Yarn |
| Deployment | Cloudflare Workers | Expo EAS Build |
