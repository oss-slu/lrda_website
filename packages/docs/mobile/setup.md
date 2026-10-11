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

The app signs in with Better Auth and loads data through the website API. Point it at a running API (locally, `pnpm dev` in `lrda_website` serves it on port 3002).

Key environment variables (configured in `app.config.js`):

- `AUTH_API_URL` -- Better Auth server (e.g. `http://localhost:3002`)
- `API_BASE_URL` -- Hono API (e.g. `http://localhost:3002`)
- `S3_PROXY_PREFIX` -- Media upload proxy
- `MAP_API_KEY` -- Google Maps key (Android)

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
