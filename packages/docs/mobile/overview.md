# Mobile App Overview

The **Where's Religion?** mobile app ([`lrda_mobile`](https://github.com/oss-slu/lrda_mobile)) is a companion to the web platform, providing the same core features -- note creation, media capture, and map exploration -- on iOS and Android via Expo and React Native.

## Current Status

The mobile app is in a **transition period**. It currently uses the legacy backend (RERUM + Firebase Auth), while the web app has already migrated to the new self-hosted stack (Hono API + PostgreSQL + Better Auth). Migration plans are in progress:

| Component | Current (Mobile) | Target (After Migration) |
| --- | --- | --- |
| **Auth** | Firebase Auth | Better Auth (via website API) |
| **API** | RERUM (`lived-religion-dev.rerum.io`) | Website API (`/api/*`) |
| **Media** | S3 Proxy (`s3-proxy.rerum.io`) | TBD (likely R2 or S3) |

During the transition, sync scripts in the website repo keep RERUM data in sync with PostgreSQL. See [Migration Status](/mobile/migration) for details.

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | Expo 53 (managed workflow) |
| **UI** | React Native 0.79 + React 19 |
| **Navigation** | React Navigation 6 (bottom tabs + stack) |
| **State** | Redux Toolkit + Redux Persist (AsyncStorage) |
| **Rich Text** | `@10play/tentap-editor` + `react-native-pell-rich-editor` |
| **Maps** | `react-native-maps` |
| **Media** | Expo modules (camera, image-picker, video-thumbnails, audio) |
| **Auth** | Firebase Auth (email/password) |
| **Backend** | RERUM API + S3 Proxy |
| **Styling** | React Native Paper (Material Design) + custom themes |

## Key Features

- **Note creation** with rich text, images, video, and audio recording
- **Location tagging** via device GPS and map picker
- **Map exploration** with markers for all published notes
- **Offline persistence** via Redux Persist + AsyncStorage
- **Onboarding flow** for first-time users
- **Theme customization** with user-selectable color palettes and dark mode
- **Swipe gestures** for note management on the home screen

## Repository

- **GitHub**: [oss-slu/lrda_mobile](https://github.com/oss-slu/lrda_mobile)
- **Platform**: iOS and Android only (no web build -- `react-native-maps` is not web-compatible)
