# Landing (Onboarding) + Login Redesign + OLD-APP Alignment — Final Report

Date: 2026-06-05
Scope verified against the original request:
1. First-launch Landing page (animated "EZ" circle, headline, description, CTA → Login).
2. Login redesign (remove top wordmark header, bitpastel SVG logo inside the card, keep OLD-APP inputs).
3. Align EMPAPP's JWT auth, profile-image update, and modal design with the OLD APP — fixing only real gaps, without forcing changes to the refresh + profile-image endpoints.

---

## 1. What was built

### First-launch Landing page — `app/onboarding.tsx`
- Renders `<AnimatedEZLogo size={120} />` over the shared `<DecorativeBackground />`.
- Headline (exact): **"Empower Your Workplace Journey"** (brand teal `#13A07C`, bold, centered).
- Description (exact, including the em dash): **"Connect with your organization, access important resources, and stay informed about company updates—all in one place."**
- CTA "Get Started" pill → `markOnboardingSeen()` then `router.replace('/login')`. No auth logic on the screen. An `advancing` guard prevents double-taps.

### Animated EZ logo — `components/AnimatedEZLogo.tsx`
- Circular teal→green (`#13A07C`→`#00A974`) gradient badge (`expo-linear-gradient`) with bold white "EZ".
- reanimated-driven entrance (scale `0.6→1`, fade `0→1`) plus a continuous "breathing" accent ring (looping scale + opacity via `withRepeat(withSequence(...))`).
- Honors OS reduce-motion (`AccessibilityInfo.isReduceMotionEnabled()`): settles to rest with no looping motion; the async lookup never blocks first paint.

### Bitpastel SVG logo — `components/BitpastelLogo.tsx`
- Inline `react-native-svg` `<Svg viewBox="0 0 101 28">` transcribed from `docs/bitpastel-logo.svg`.
- Source has 10 paths (9 green `#00A974` + 1 dark `#2A2A2A` "t"); the component maps the single dark path to `darkColor` and the rest to `color`, preserving the wordmark. Height auto-derives from the 101:28 ratio.

### Shared backdrop — `components/DecorativeBackground.tsx`
- Pastel-blob constellation extracted into a reusable component (used by onboarding).

### First-launch flag — `helpers/onboarding.ts`
- AsyncStorage-backed `hasSeenOnboarding()` / `markOnboardingSeen()`, key `@emp_has_seen_onboarding` (namespaced to match `@emp_*`). Written on explicit CTA advance, not on view — killing the app on the landing page keeps it showing next launch.

### Login redesign — `app/login.tsx`
- Top `BrandWordmark` header removed (import + header block + `brandRow` style gone; confirmed `BrandWordmark` no longer referenced in `login.tsx`).
- `<BitpastelLogo width={140} />` now renders inside the card (`styles.logoWrap`), centered above the "Employee Zone" title.
- OLD-APP-style inputs retained: the local `Field` component (soft-filled rounded fields, teal focus border, password eye toggle) is unchanged.
- All auth wiring untouched: `validate()`, `authService.login()`, `signIn(result)`, `router.replace('/(protected)/(tabs)/dashboard')`, and `loginErrorMessage()`.

### Routing — `app/index.tsx` + `app/_layout.tsx`
- Splash gate: restores `getAuth()`; signed-in → dashboard; signed-out → `hasSeenOnboarding() ? '/login' : '/onboarding'`. The `cancelled` guard and `<Loader/>` are preserved.
- `_layout.tsx` registers `<Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />` alongside login/(protected).

### Dependency
- `react-native-svg@15.12.1` added (SDK-54 compatible), required by `BitpastelLogo`.

---

## 2. What was aligned vs the OLD APP (gaps actually closed)

Per the alignment report, EMPAPP is a deliberately cleaner re-architecture; the work closed the **real** behavioral gaps without changing endpoint contracts:

- **Single-flight refresh + token rotation** (`api/refreshToken.ts`): bare axios client (no interceptors → no recursion), `saveRotatedTokens` persists the rotated pair, clears SecureStore on failure. Mirrors the OLD APP's `isRefreshing`/`refreshPromise` single-flight.
- **`sessionExpired` is now surfaced** (was a noted gap): `refreshAccessToken()` dispatches `setSessionExpired(true)` both when there is no refresh token and on refresh failure; `app/(protected)/_layout.tsx` reacts by clearing the session, showing a "Your session has expired" toast, and routing to `/login` — matching the OLD APP's session-expiry UX.
- **"Account no longer active" force-logout branch added** (was a noted gap): the `axiosInstance` 401 interceptor early-exits on `data.status === 'ERROR' && message === 'Account is no longer active.'`, clearing the session and surfacing expiry instead of attempting a refresh.
- **Profile picture upload** (`api/services/profileService.ts`): multipart `FormData` with a `{uri, name, type}` file object, `multipart/form-data` override, and a 60s timeout (matching the OLD APP's upload window).

### Endpoint contracts deliberately NOT changed (per user decision)
- Refresh endpoint stays `ENDPOINTS.auth.refresh = 'refresh'` with body `{ refresh_token }` and **flat** `data.access_token`/`data.refresh_token` (NOT the OLD APP's `auth/token/refresh` nested under `data.data`). This matches EMPAPP's own documented login contract.
- Profile-picture multipart field stays `profile_picture` and route `ENDPOINTS.profile.picture = 'profile/picture'` (NOT the OLD APP's `profile_image` / `V1/upload-profile-img`).
- Both remain flagged in code (`endpoints.ts`) and in the alignment report as MUST-CONFIRM-with-backend before they work end-to-end.

Modal design was confirmed already aligned (`ConfirmModal` mirrors `CustomAlert`; `ActionSheet` covers the source chooser) — no change required.

---

## 3. Verification evidence

### Static gate
- TypeScript: 0 errors.
- expo lint: clean (2 pre-existing warnings in unrelated files).
- expo-doctor: 18/18.

### Emulator
- First launch → Landing (animated EZ badge + exact headline + exact description) → "Get Started" → Login (bitpastel SVG inside the card, no top header, OLD-APP inputs).
- Screenshots: `EMPAPP/docs/screenshots/landing.png` (also saved as `firstlaunch.png` — byte-identical duplicate) and `EMPAPP/docs/screenshots/login.png`.

---

## 4. Deliberately-skipped follow-ups (not in scope / by-product decision)

- **2 MB client-side image size guard** — would need `expo-file-system` (not a dependency). Skipped.
- **Upload retry / exponential backoff** — OLD APP does 3 attempts; EMPAPP keeps a single attempt with the 60s timeout. Skipped.
- **"Remove photo" ActionSheet option** — depends on backend support for clearing the picture. Skipped (product decision).
- **The two MUST-CONFIRM backend endpoints** — refresh path/nesting and profile-picture field/route left as-is per the user's explicit decision not to force-change them.
- **Permission-denied deep link to Settings** (`Linking.openSettings()`) — EMPAPP toasts instead. Skipped (optional UX).

---

## 5. Residual concerns (minor, non-blocking)

1. **Duplicate `DecorativeBackground` in `login.tsx`.** The plan called for `login.tsx` to import the new shared `components/DecorativeBackground.tsx`, but `login.tsx` still defines its own local `CIRCLES` + `DecorativeBackground` + `blob` style (lines ~199–228). The constants are identical to the shared component, so the two screens look the same — but the extraction is only half-done, leaving duplicated code. Functionally fine; worth a small cleanup to delete the local copy and import the shared one.
2. **Doc-comment miscount in `BitpastelLogo.tsx`.** The comment says "eleven green paths plus one dark"; the source SVG has 9 green + 1 dark. Cosmetic comment nit only — the logo renders correctly (confirmed in `login.png`).
3. **`landing.png` / `firstlaunch.png` are byte-identical** (205187 bytes) — appears to be the same capture saved twice. No impact.

No scope creep was found: every new file/dependency maps directly to a requested feature; no unrequested functionality was added.
