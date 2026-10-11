# Mobile App Overview

The **Where's Religion?** mobile app ([`lrda_mobile`](https://github.com/oss-slu/lrda_mobile)) is a companion to the web platform, providing the same core features -- note creation, media capture, and map exploration -- on iOS and Android via Expo and React Native.

## Current Status

The mobile app uses the same backend as the web app: Better Auth and the Hono API from the website repo. Media uploads go through the S3 proxy (`s3-proxy.rerum.io`), which is planned to move to our own S3 or R2 storage.

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
| **Auth** | Better Auth (email/password, via website API) |
| **Backend** | Website Hono API + S3 Proxy |
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
