# Employee Zone (EMPAPP)

The **Employee Zone** mobile app is a React Native application built with [Expo](https://expo.dev/)
and [Expo Router](https://docs.expo.dev/router/introduction/). It is the mobile companion to the
Bitpastel Employee Zone portal, giving employees access to their dashboard, internal content,
collaboration days, rewards, and profile from their phone.

## Features

- **Login** – Authenticates against the Employee Zone API (`/api`) with secure token storage
  and automatic refresh-token rotation.
- **Dashboard** – Landing screen after login, surfacing the employee's key information and
  entry points into the rest of the app.
- **Content detail** – Rich detail view for individual content items (`content/[id]`),
  including the static **Internal Mobility** page.
- **Collaboration days** – Lets employees view and manage collaboration / collab-day data.
- **Reward / BitPoints & Incentives** – Rewards view showing the employee's points and
  available incentives.
- **Profile** – View and update profile details, including a profile picture via the camera
  or photo library.

## Tech stack

- Expo SDK 54 / React Native 0.81 (New Architecture, Hermes)
- Expo Router (typed routes)
- Redux Toolkit + React Redux for state, TanStack Query for data fetching
- Axios for HTTP, `expo-secure-store` for token persistence
- NativeWind (Tailwind) for styling, `react-native-reanimated` for motion

## Prerequisites

- **Node.js** 20 LTS or newer and **npm** (bundled with Node).
- **Expo CLI** – no global install needed; commands are run via `npx expo …`.
- **EAS CLI** for cloud builds: `npm install -g eas-cli` (requires an Expo account).
- A **device or emulator**:
  - Android: Android Studio + an emulator, or a physical device with USB debugging.
  - iOS: Xcode + the iOS Simulator (macOS only), or a physical device.

> **Expo Go caveat:** this app relies on native modules (`expo-secure-store`, `expo-image-picker`,
> `expo-video`, custom config plugins, etc.) that are **not** available in the stock Expo Go app.
> Use a **development build** (`expo-dev-client`) to run on a device/emulator. Plain `npx expo start`
> with Expo Go will fail to load the native features.

## Installation

```bash
npm install
```

## Environment setup

The app reads its configuration from environment variables (see `config/index.ts`).

1. Copy the example file and fill in your values:

   ```bash
   cp .env.example .env
   ```

2. Set the variables in `.env`:

   - `EXPO_PUBLIC_BASE_URL` – Base URL of the Employee Zone API (note the trailing slash).
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `_ANDROID_CLIENT_ID` / `_IOS_CLIENT_ID` – Google OAuth
     client IDs (the portal uses Google sign-in).

> In production builds these values are read from `app.json` → `expo.extra` rather than `.env`.
> The `.env` file is git-ignored; never commit real secrets.

## Running the app (development)

Start the Metro bundler / dev server:

```bash
npx expo start            # or: npm start
npm run dev               # start with the dev client
npm run dev:clear         # start with a cleared cache
```

Run on a specific platform:

```bash
npm run android           # build & run on Android (expo run:android)
npm run ios               # build & run on iOS (expo run:ios)
npm run web               # run in the browser (expo start --web)
```

Lint the project:

```bash
npm run lint              # expo lint
```

## EAS builds

Build profiles are defined in `eas.json`. Run these with the EAS CLI:

```bash
# Development build (internal distribution, includes the dev client)
eas build --profile development --platform android
eas build --profile development --platform ios

# Preview build (internal distribution; Android produces an APK, arm64-only)
eas build --profile preview --platform android

# Production build (auto-increments the build number)
eas build --profile production --platform android
eas build --profile production --platform ios

# Submit a production build to the stores
eas submit --profile production --platform android
```

The app version source is `remote` (`appVersionSource: "remote"`), so EAS manages the build number.

## Project structure

```
app/                         Expo Router routes (file-based navigation)
  _layout.tsx                Root layout: providers (Redux, Query, theme, feedback)
  index.tsx                  Entry / redirect
  login.tsx                  Login screen
  (protected)/               Authenticated area (guarded by _layout.tsx)
    (tabs)/                  Bottom-tab screens: dashboard, bitpoints, incentives, profile
    content/[id].tsx         Content detail screen
    detail/internal-mobility.tsx  Static Internal Mobility content

api/                         Data layer
  axiosInstance.ts           Central axios instance + auth/401-refresh interceptors
  apiRequest.ts              Generic request wrapper (logging gated behind __DEV__)
  refreshToken.ts            Single-flight refresh-token rotation logic
  endpoints.ts               API route definitions
  useApi.ts                  Hook helpers over TanStack Query
  services/                  Feature services (auth, dashboard, profile, bitpoints, collaboration)
  types.ts / index.ts        Shared API types and barrel export

components/                  Shared UI components (Button, EmptyState, Skeleton, Toast,
                             ScreenContainer, RewardsView, motion primitives, …)
constants/theme/             Design tokens + ThemeProvider (colors, spacing, typography, shadows)
helpers/                     Utilities (auth storage, image helpers)
hooks/                       Reusable hooks (e.g. useAuth)
provider/                    Redux store, slices, and typed hooks
config/                      Runtime config (reads env / app.json extra)
plugins/                     Custom Expo config plugins
assets/                      Images, fonts, and design references
```

## Notes

- API request/response logging is only emitted in development (gated behind `__DEV__`);
  nothing is logged in production builds.
- Authentication tokens are stored with `expo-secure-store` and rotated automatically on 401.
