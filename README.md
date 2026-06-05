# Employee Zone — Mobile App (EMPAPP)

React Native (Expo + Expo Router, TypeScript) mobile app for the **Employee
Zone** portal. The structure mirrors the existing OLD APP codebase so the two
stay consistent.

**v1 scope:** Login → Profile + Employee Directory. The API layer is scaffolded
but intentionally left for you to wire to the real backend.

---

## Tech stack

| Concern          | Choice                                   |
| ---------------- | ---------------------------------------- |
| Framework        | Expo (`~54`) + Expo Router (file-based)  |
| Language         | TypeScript (strict)                      |
| Styling          | NativeWind (Tailwind) + a theme system   |
| Data fetching    | axios + TanStack Query                   |
| Global state     | Redux Toolkit (`auth` slice)             |
| Secure storage   | `expo-secure-store` (tokens + cached user) |

---

## Folder structure

```
EMPAPP/
├── app/                      # Screens (Expo Router file-based routing)
│   ├── _layout.tsx           # Root: SafeArea → Theme → Query → Redux → Stack
│   ├── index.tsx             # Splash gate: restore session → route
│   ├── login.tsx             # Email/password login
│   └── (protected)/          # Auth-guarded area
│       ├── _layout.tsx       # Redirects to /login if not authenticated
│       └── (tabs)/
│           ├── _layout.tsx   # Bottom tabs: Directory + Profile
│           ├── directory/index.tsx
│           └── profile/index.tsx
│
├── api/                      # >>> API layer — integrate the backend here <<<
│   ├── axiosInstance.ts      # Base axios + auth/401 interceptors
│   ├── apiRequest.ts         # Generic request wrapper
│   ├── useApi.ts             # TanStack Query generic hook
│   ├── endpoints.ts          # All endpoint paths in one place
│   ├── types.ts              # API request/response types
│   ├── services/             # Feature services
│   │   ├── authService.ts
│   │   └── profileService.ts
│   └── index.ts              # Barrel export
│
├── components/               # Reusable UI (Button, TextField, EmptyState, …)
├── config/                   # Env/config resolution (baseUrl, Google IDs)
├── constants/theme/          # Design system: colors, typography, spacing, …
├── helpers/                  # Utilities + auth (secure-store) helpers
├── hooks/                    # Custom hooks (useAuth)
├── provider/                 # Redux store, slices, typed hooks
└── assets/                   # Images, fonts, etc.
```

Path alias `@/*` maps to the project root (see `tsconfig.json`), so imports look
like `import { Button } from '@/components'`.

---

## Getting started

```bash
cd EMPAPP
npm install          # or: yarn / pnpm install
cp .env.example .env # then fill in EXPO_PUBLIC_BASE_URL etc.
npm start            # press a (Android) / i (iOS) / w (web)
```

> The app runs immediately with placeholder API endpoints — login/list calls
> will fail until you point them at the real backend (see below).

---

## Integrating the API (your part)

Everything you need to touch lives under `api/` and `config/`.

1. **Base URL** — set `EXPO_PUBLIC_BASE_URL` in `.env` (dev) and
   `expo.extra.baseUrl` in `app.json` (production builds). Keep the trailing
   slash, e.g. `https://.../api/`.

2. **Endpoints** — edit `api/endpoints.ts` to match real routes.

3. **Services** — update `api/services/*.ts` so the request body and the
   response → app-model mapping match the backend contract (look for the
   `TODO` markers and the `data.access_token ?? data.accessToken` style maps).

4. **Types** — refine `api/types.ts` to the actual payload shapes.

5. **Auth tokens** — `axiosInstance.ts` already attaches the stored access
   token to every request and flags 401s. Add your token-refresh flow inside
   the response interceptor when the refresh endpoint is ready.

6. **Google sign-in** — the existing portal uses Google OAuth. A
   `authService.googleLogin(idToken)` stub is ready; add
   `@react-native-google-signin/google-signin` + the client IDs in `config/`
   when you're ready to wire it.

### Calling the API from a screen

```tsx
import { useQuery } from '@tanstack/react-query'
import { profileService } from '@/api'

const { data, isLoading } = useQuery({
  queryKey: ['profile'],
  queryFn: profileService.getProfile,
})
```

or with the generic hook:

```tsx
import { useApi } from '@/api'

const { data, isLoading } = useApi({ key: ['profile'], url: 'profile' })
```

---

## Notes

- This is a **scaffold/starting point** — screens render with real layout but
  the data is only as real as the backend you connect.
- No native `ios/` or `android/` folders are committed; run `expo run:ios` /
  `expo run:android` (or use a dev client) to generate them when needed.
- Add app icons/splash under `assets/images/` and reference them in `app.json`.
