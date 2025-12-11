# Condomínio Fácil - Mobile Wrapper

## Overview
This mobile application is a lightweight wrapper around the main "Condomínio Fácil" PWA, built with Expo and `react-native-webview`. It provides native capabilities like Push Notifications.

## Setup
1. `cd mobile`
2. `npm install`
3. `npx expo start` to run locally.

## Building for Stores
### Android
Run from root:
`npm run mobile:android`
This uses EAS Build to generate an APK/AAB.

### iOS
Run from root:
`npm run mobile:ios`
This uses EAS Build.

## Publish Steps
1. **Google Play Store**: Upload the `.aab` file to the Play Console. Ensure you have the keystore configured in EAS.
2. **Apple App Store**: Upload the `.ipa` file via Transporter or EAS Submit. Ensure provisioning profiles are set.

## Configuration
Edit `app.json` for name, icon, and bundle identifiers.
