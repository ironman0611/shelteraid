# Shelter Aid

A React Native mobile app that helps users find emergency shelters, transitional housing, food banks, and medical services near them. Built with Expo and includes 7,000+ real shelter locations across the United States.

## Features

- Interactive map with clustered markers and location-based filtering
- Search and list view with text search and category filters
- Detailed shelter info: address, capacity, services, hours, eligibility
- GPS-based distance calculation and sorting
- Light, Dark, and Forest themes with persistent preferences
- Call, get directions, or visit a shelter's website directly from the app

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9+ or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

```bash
npm install -g expo-cli
```

For running on a physical device:
- [Expo Go](https://expo.dev/client) app on your iOS or Android device

For running on a simulator/emulator:
- **iOS**: Xcode (Mac only) with an iOS Simulator
- **Android**: Android Studio with an Android Virtual Device (AVD)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd shelteraid
```

### 2. Install dependencies

```bash
npm install
```

This installs all required packages including:

| Package | Purpose |
|---|---|
| `expo ~54.0.33` | Core Expo SDK and build tooling |
| `react 19.1.0` | React framework |
| `react-native 0.81.5` | React Native runtime |
| `expo-location ~19.0.8` | GPS and location permissions |
| `expo-haptics ~15.0.8` | Haptic feedback |
| `expo-linking ~8.0.11` | Deep linking and external URLs |
| `expo-status-bar ~3.0.9` | Status bar control |
| `@react-navigation/native ^7.2.2` | Navigation container |
| `@react-navigation/bottom-tabs ^7.15.9` | Bottom tab navigator |
| `@react-navigation/native-stack ^7.14.10` | Stack navigator |
| `react-native-maps 1.20.1` | Map component (Google Maps / Apple Maps) |
| `react-native-map-clustering ^4.0.0` | Map marker clustering |
| `react-native-paper ^5.15.1` | Material Design UI components |
| `react-native-gesture-handler ~2.28.0` | Touch gesture support |
| `react-native-reanimated ~4.1.1` | Smooth animations |
| `react-native-safe-area-context ~5.6.0` | Safe area insets |
| `react-native-screens ~4.16.0` | Native screen containers |
| `@react-native-async-storage/async-storage ^3.0.2` | Persistent local storage |
| `@expo/ngrok ^4.1.3` | Tunnel for LAN development |

## Running the App

### Start the development server

```bash
npm start
# or
npx expo start
```

This opens the Expo Dev Tools in your browser and prints a QR code in the terminal.

### Run on a physical device

1. Install the **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scan the QR code shown in the terminal with your phone's camera (iOS) or the Expo Go app (Android)

### Run on iOS Simulator (Mac only)

```bash
npm run ios
# or
npx expo start --ios
```

Requires Xcode installed from the Mac App Store.

### Run on Android Emulator

```bash
npm run android
# or
npx expo start --android
```

Requires Android Studio with at least one AVD configured.

### Run in a web browser

```bash
npm run web
# or
npx expo start --web
```

> Note: Map clustering and some native features may behave differently on web.

## Permissions

The app requests the following device permissions at runtime:

| Permission | Platform | Purpose |
|---|---|---|
| `NSLocationWhenInUseUsageDescription` | iOS | Find shelters near your current location |
| `ACCESS_FINE_LOCATION` | Android | Precise GPS location |
| `ACCESS_COARSE_LOCATION` | Android | Approximate location fallback |

Location permission is optional — the app works without it but distance-based sorting will not be available.

## Project Structure

```
shelteraid/
├── App.tsx                  # Root component, theme & navigation setup
├── index.ts                 # Expo entry point
├── app.json                 # Expo app configuration
├── assets/                  # Icons, splash screen, images
├── data/
│   └── shelters.json        # 7,000+ shelter records
├── scripts/
│   ├── importHUD.js         # HUD Housing Inventory Count importer
│   └── fetchRealData.js     # Open data fetcher (NYC, DC, LA County)
└── src/
    ├── components/          # Reusable UI components
    ├── hooks/               # useLocation, useShelters
    ├── navigation/          # RootNavigator, tab & stack config
    ├── screens/             # MapScreen, SearchScreen, DetailScreen
    ├── services/            # shelterService.ts (data loading & filtering)
    ├── theme/               # ThemeProvider, light/dark/forest themes
    └── types/               # TypeScript interfaces (Shelter, ShelterType)
```