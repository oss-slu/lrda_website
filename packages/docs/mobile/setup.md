# Mobile Setup

Get the mobile app running locally for development.

## Prerequisites

- **Node.js** 18+
- **Yarn** 1.x (the mobile repo uses Yarn, not pnpm)
- **Expo Go** app on your phone, or iOS Simulator / Android Emulator
- **Git**

## 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/lrda_mobile.git
cd lrda_mobile
yarn install
```

## 2. Environment Setup

The app uses Firebase for authentication. You need Firebase configuration values set as environment variables. Contact the team lead for the development Firebase project credentials.

Key environment variables (configured in `app.config.js`):

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_DATABASE_URL`

## 3. Start the Dev Server

```bash
yarn start
```

This launches the Expo dev server. From there:

- Press **`a`** to open in Android emulator
- Press **`i`** to open in iOS simulator
- Scan the QR code with Expo Go on a physical device

## Common Commands

| Command | Description |
| --- | --- |
| `yarn start` | Start Expo dev server |
| `yarn test` | Run Jest tests |
| `yarn lint` | Run ESLint |

## Known Issues

- **NaN in location**: Occasionally the location picker returns NaN values on certain devices
- **iOS scroller**: Horizontal scroll can be jerky on some iOS versions
- **Android map**: Map marker positioning can be offset on older Android devices

See the [README](https://github.com/oss-slu/lrda_mobile#known-bugs) for the latest known issues.
