# Landing (Onboarding) + Login Redesign — Implementation Plan

Target app: **EMPAPP** (Expo Router, `react-native-reanimated` present,
`@react-native-async-storage/async-storage` present, **`react-native-svg` NOT
installed**).

Brand colors: **teal `#13A07C`** (exported as `BRAND_GREEN` from
`@/constants/theme`), **green `#00A974`** (the bitpastel SVG green; will be a
local const in the logo/badge components). The login pastel-blob background and
the green button/title already use `#13A07C`.

Goal:
1. First-launch **onboarding Landing page** (animated "EZ" circle, headline,
   description, CTA → Login). Shown **only on first launch** (AsyncStorage flag);
   afterwards signed-out users go straight to Login.
2. **Redesign Login**: remove the top `BrandWordmark` header; render the
   **bitpastel SVG logo** (`docs/bitpastel-logo.svg`) **inside** the login card,
   centered, above the "Employee Zone" title; keep OLD-APP-style inputs.

> No auth/wiring changes: `authService.login`, `validate()`, and the
> `signIn → router.replace('/(protected)/(tabs)/dashboard')` flow in
> `app/login.tsx` stay exactly as they are.

---

## 1. `BitpastelLogo` SVG component — `components/BitpastelLogo.tsx`

Renders the saved logo (`EMPAPP/docs/bitpastel-logo.svg`, `viewBox 0 0 101 28`,
fills `#00A974` green + `#2A2A2A` dark) via `react-native-svg`. Because the SVG
file is in `docs/` (not a bundleable asset path) and RN can't import raw `.svg`
without a transformer, **transcribe the 12 `<path>` d-attributes into an inline
`<Svg>`** rather than loading the file at runtime.

```tsx
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg'

const GREEN = '#00A974'
const DARK = '#2A2A2A'

interface BitpastelLogoProps { width?: number; color?: string; darkColor?: string }

export const BitpastelLogo: React.FC<BitpastelLogoProps> = ({
  width = 132,            // 101:28 ratio → height = width * 28/101
  color = GREEN,
  darkColor = DARK,
}) => {
  const height = (width * 28) / 101
  return (
    <Svg width={width} height={height} viewBox="0 0 101 28" fill="none">
      <G clipPath="url(#clip0)">
        {/* paste the 12 <Path d="..."/> from docs/bitpastel-logo.svg,
            keeping fill={color} for #00A974 paths and fill={darkColor}
            for the single #2A2A2A path (the "t" glyph). */}
      </G>
      <Defs>
        <ClipPath id="clip0"><Rect width={101} height={28} fill="#fff" /></ClipPath>
      </Defs>
    </Svg>
  )
}
```

- Keep the one `#2A2A2A` path mapped to `darkColor`; all others to `color`.
- Export from `components/index.ts`.

---

## 2. `AnimatedEZLogo` component — `components/AnimatedEZLogo.tsx`

Circular "EZ" badge using **react-native-reanimated** (already installed).

- **Visual**: a `size` (default ~104) circle. Fill via `expo-linear-gradient`
  (already a dep) using `[BRAND_GREEN, '#00A974']` (teal→green); centered bold
  white **"EZ"** text. Soft shadow for lift (matches the login card shadow style).
- **Entrance**: `useSharedValue` scale `0.6→1` + opacity `0→1` on mount
  (`withTiming`/`withSpring`, ~500 ms).
- **Continuous gentle animation**: a subtle infinite loop — e.g. `withRepeat`
  on a translateY (±4 px) or scale (1↔1.04) breathing, `reverse: true`. Keep it
  understated. Use `Animated.View` from `react-native-reanimated` with a
  `useAnimatedStyle`.
- Optional reduced-motion respect via `AccessibilityInfo` (nice-to-have).
- Export from `components/index.ts`.

> reanimated v4 + `react-native-worklets` are present; ensure the babel
> worklets plugin is configured (standard Expo SDK 54 setup — already in place
> since reanimated is used elsewhere).

---

## 3. Landing page — `app/onboarding.tsx`

Reuses the **pastel decorative-blob background** from `app/login.tsx`. The blob
code there (`CIRCLES`, `DecorativeBackground`, `styles.blob`) is currently
**local to login.tsx**. Plan:
- **Extract** the blob background into a shared
  `components/DecorativeBackground.tsx` (move `CIRCLES` + the component +
  `blob`/screen-fraction logic), and have **both** `login.tsx` and
  `onboarding.tsx` import it. (Avoids duplicating the constellation and keeps the
  two screens visually identical.)

Layout (centered column over the blob background, `StatusBar style="dark"`,
safe-area padded):
1. `<AnimatedEZLogo />` (top, centered).
2. Headline: **"Empower Your Workplace Journey"** (brand teal, bold, centered).
3. Description paragraph: *"Connect with your organization, access important
   resources, and stay informed about company updates—all in one place."*
   (muted gray, centered, comfortable line-height).
4. CTA button **"Get Started"** (green `#13A07C` pill, full-width-ish) → on press:
   `await markOnboardingSeen()` then `router.replace('/login')`.

No auth logic on this screen.

---

## 4. First-launch flag helper — `helpers/onboarding.ts`

AsyncStorage-backed (async-storage already installed):

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
const ONBOARDING_SEEN_KEY = '@emp_has_seen_onboarding'

export const hasSeenOnboarding = async (): Promise<boolean> => {
  try { return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === 'true' }
  catch { return false }
}
export const markOnboardingSeen = async (): Promise<void> => {
  try { await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true') } catch {}
}
```

- Export via `helpers/index.ts` (add `export * from './onboarding'`).
- Key namespaced `@emp_*` to match the existing `@emp_theme_mode` convention.

---

## 5. Routing changes

### `app/index.tsx` (splash gate)
Current: restores `getAuth()` → signed-in→dashboard, else→`/login`.
New decision tree (after restoring the session):
- `stored?.accessToken` present → dispatch `setAuthDetails` →
  `router.replace('/(protected)/(tabs)/dashboard')` (unchanged).
- else (signed out): `const seen = await hasSeenOnboarding()`
  - `!seen` → `router.replace('/onboarding')`
  - `seen` → `router.replace('/login')`
- Keep the existing `cancelled` guard + `<Loader/>` while deciding.
- The CTA on the onboarding screen calls `markOnboardingSeen()` (so it's marked
  on **explicit advance**, not merely on view — survivable if the user kills the
  app on the landing page).

### `app/_layout.tsx` (register route)
Add an onboarding `Stack.Screen` alongside the existing ones:
```tsx
<Stack.Screen name="index" />
<Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
<Stack.Screen name="login" options={{ gestureEnabled: false }} />
<Stack.Screen name="(protected)" options={{ gestureEnabled: false }} />
```
(`gestureEnabled: false` so users can't swipe back into onboarding from login.)

---

## 6. Login redesign — `app/login.tsx`

Keep **all** auth wiring (`validate`, `authService.login`, `signIn`,
`router.replace('/(protected)/(tabs)/dashboard')`, `loginErrorMessage`) and the
pastel blob background unchanged. UI edits only:

1. **Remove the top `BrandWordmark` header**: delete the `<View style={styles.brandRow}>…<BrandWordmark/></View>` block and the `BrandWordmark` import; drop the now-unused `brandRow` style.
2. **Add the SVG logo inside the card**, centered, **above** the "Employee Zone"
   title: at the top of `styles.card`, render
   `<View style={styles.logoWrap}><BitpastelLogo width={132} /></View>` then the
   existing `<Text style={styles.title}>Employee Zone</Text>`. Add a `logoWrap`
   style (`alignItems:'center', marginBottom: 16`).
3. **Keep OLD-APP-style inputs**: the existing local `Field` component already
   matches the OLD APP's filled, pill-ish input look (rounded, soft fill,
   teal focus border, eye toggle). Retain it. (Optional: bump `borderRadius` of
   `styles.field` toward the OLD APP's larger pill radius if a closer match is
   wanted — purely cosmetic.)
4. If `DecorativeBackground` is extracted (section 3), swap login's local copy
   for the shared import and remove the local `CIRCLES`/`DecorativeBackground`/
   `blob` definitions.

No changes to validation, submission, error mapping, or navigation.

---

## Files to create
- `EMPAPP/components/BitpastelLogo.tsx`
- `EMPAPP/components/AnimatedEZLogo.tsx`
- `EMPAPP/components/DecorativeBackground.tsx` (extracted from `login.tsx`; shared by login + onboarding)
- `EMPAPP/app/onboarding.tsx`
- `EMPAPP/helpers/onboarding.ts`

## Files to modify
- `EMPAPP/app/login.tsx` — remove `BrandWordmark` header, add `BitpastelLogo` inside the card above the title, use shared `DecorativeBackground` (auth wiring untouched).
- `EMPAPP/app/index.tsx` — add the `hasSeenOnboarding` branch to the signed-out path.
- `EMPAPP/app/_layout.tsx` — register the `onboarding` Stack.Screen.
- `EMPAPP/components/index.ts` — export `BitpastelLogo`, `AnimatedEZLogo`, `DecorativeBackground`.
- `EMPAPP/helpers/index.ts` — `export * from './onboarding'`.
- `EMPAPP/package.json` — adds `react-native-svg` (via `expo install`).

## Dependencies
- **`react-native-svg`** — required by `BitpastelLogo`. Install with
  `npx expo install react-native-svg` (Expo picks the SDK-54-compatible version).
- Already present (no install): `react-native-reanimated` (+ `react-native-worklets`),
  `@react-native-async-storage/async-storage`, `expo-linear-gradient`.
- Optional only if size-guard from the alignment report is added later:
  `expo-file-system` (NOT needed for landing/login work).
