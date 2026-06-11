# Dashboard Premium Hero-Slider Refactor Spec

Analysis-only spec. No source files were modified. This document describes the
target architecture for splitting the dashboard into reusable components under
`components/dashboard/`, with a strict theme-token contract.

## 1. Context & constraints

### Current dashboard
`app/(protected)/(tabs)/dashboard/index.tsx` is a single ~810-line file that
mixes: data fetching (`useQuery(['dashboard','content'])` via
`dashboardService.getContent`), an auto-hiding floating chip bar, category
chips, the per-section horizontal coverflow pager, the hero card, the
presentation card, and the social section — plus all the loading / error / empty
states. It currently violates the design-system rule everywhere: it hardcodes
`BRAND = '#13A07C'`, `#FFFFFF`, `#1B2233`, `#9FB0C7`, `#6B7280`, `#16233A`,
`#F2F4F8`, `#33425C`, `#D5DBE3`, `#0F1A2C`, `rgba(...)` overlays, etc.

### Theme system (the only allowed color source)
`useTheme()` (from `constants/theme/ThemeProvider.tsx`) returns
`{ colors, typography, spacing, borderRadius, layout, shadows, isDark, ... }`.
`colors` is a `ThemeColors` object (see `constants/theme/colors.ts`):

- `colors.brand.primary` / `colors.brand.secondary` / `colors.brand.gradient`
- `colors.background.{primary,secondary,card,input,overlay,modalOverlay}`
- `colors.text.{primary,secondary,tertiary,inverse,link,placeholder}`
- `colors.border.{default,light,focus,error}`
- `colors.semantic.{success,error,warning,info,...}`
- `colors.icon.{primary,secondary,active,inactive}`
- `colors.tabBar.{background,active,inactive,border}`

Exported helpers from `@/constants/theme`:
- `BRAND_GREEN` (`#13A07C`) and `BRAND_GREEN_DARK` (`#0E7A60`) — the ONE allowed
  brand literal. The spec aliases `BRAND = colors.brand.primary` (preferred,
  dynamic) or imports `BRAND_GREEN as BRAND`.
- `pastelAt(i): Pastel` and `pastels` — per-index fallback tints
  (`{ bg, accent }`) used when a card has no image.
- Design tokens: `spacing`, `borderRadius`, `typography`, `shadows`.

NOTE: `ThemeProvider` is currently pinned to light (`isDark` always `false`),
but components MUST still read `isDark` for any light/dark conditional so the app
is correct if dark mode is re-enabled. Never branch on a hardcoded literal.

### Available libraries (confirmed in package.json)
- `react-native-reanimated` `~4.1.1` (with `react-native-worklets` `0.5.1`)
- `expo-image` `~3.0.11`
- `expo-linear-gradient` `~15.0.8`

### Primitives reused (unchanged)
- `components/motion/PressableScale.tsx` — spring press feedback (`activeScale`).
- `components/motion/Reveal.tsx` — staggered entrance (`index`, `direction`).
- `components/AppHeader.tsx` — greeting kicker + title + avatar (Profile route).

## 2. Component plan (all under `components/dashboard/`)

A new barrel `components/dashboard/index.ts` re-exports all five. The main
components barrel `components/index.ts` adds one line:
`export * from './dashboard'` (or named re-exports). API types in
`api/types.ts` are imported, never modified.

### 2.1 `DashboardHeader`
- **Path:** `components/dashboard/DashboardHeader.tsx`
- **Responsibility:** Thin wrapper around the existing `<AppHeader/>`. Keeps
  greeting + avatar exactly (`kicker={greeting}`, `title={firstName}`,
  `align="left"`), but owns the surrounding spacing/typography polish (top
  padding, bottom margin) so the dashboard screen no longer inlines it. Does NOT
  change `AppHeader` internals.
- **Props:**
  ```ts
  interface DashboardHeaderProps {
    greeting: string   // greetingForNow() result, e.g. "Good Morning"
    firstName: string  // user?.name?.split(' ')[0] ?? 'there'
  }
  ```
- **Tokens:** `spacing.lg` (horizontal/top), `spacing.base` (bottom);
  optional container `colors.background.primary`. (Avatar + title typography live
  inside `AppHeader` and are out of scope.)
- **Animations:** none of its own; the caller wraps it in `<Reveal index={0}/>`.

### 2.2 `CategoryTabs`
- **Path:** `components/dashboard/CategoryTabs.tsx`
- **Responsibility:** API-driven horizontal category chips from `meta.tabs`
  (`DashboardTab[]`). Controlled component: parent owns `activeTab` /
  `onChange`. Replaces the inline `renderChips()`; reused for BOTH the in-flow
  header chips and the floating auto-hiding bar (parent passes the same element
  / props into its `Animated.View`). Each chip is a `PressableScale`
  (`activeScale={0.93}`).
- **Props:**
  ```ts
  import type { DashboardTab } from '@/api/types'
  interface CategoryTabsProps {
    tabs: DashboardTab[]
    activeKey: string
    onChange: (key: string) => void
    style?: StyleProp<ViewStyle>
  }
  ```
- **Tokens:** active chip bg `colors.brand.primary` (BRAND), active chip text
  `colors.text.inverse` (background text); inactive chip bg
  `colors.background.secondary`, inactive chip text `colors.text.secondary`;
  radius `borderRadius.full`; gap/padding from `spacing`.
- **Animations:** per-chip press spring via `PressableScale`. Optional: animate
  active chip background with `withTiming` on selection. The floating-bar
  reveal/translate stays in the screen (it spans more than the tabs).

### 2.3 `HeroCarousel`
- **Path:** `components/dashboard/HeroCarousel.tsx`
- **Responsibility:** Horizontal snap pager for a section's items. Replaces
  `SectionCarousel` + `CoverflowCard`. Card width = 84% of screen width
  (`Math.round(width * 0.84)`), neighbours peek via symmetric side padding
  `(width - cardWidth) / 2`, snap interval = `cardWidth + gap`. Drives
  per-card interpolation (active scale 1 / inactive 0.92, slight translateX,
  opacity) and feeds `PaginationDots`. Renders `HeroCard` per item (the
  presentations special card and single-item centering are preserved — see
  Preserve Contract). Owns the section title (`section.title`).
- **Props:**
  ```ts
  import type { DashboardSection, DashboardItem } from '@/api/types'
  interface HeroCarouselProps {
    section: DashboardSection
    onPressItem: (item: DashboardItem) => void
  }
  ```
- **Tokens:** section title `colors.text.primary`; section bg inherits
  `colors.background.primary`; gap/margins from `spacing`. (Card colors live in
  `HeroCard`; dot colors live in `PaginationDots`.)
- **Animations (Reanimated, UI thread):**
  - `scrollX = useSharedValue(0)` via `useAnimatedScrollHandler` on the
    horizontal `Animated.ScrollView` (or `Animated.FlatList`).
  - Per-card `useAnimatedStyle` interpolating off `scrollX` over input range
    `[(i-1)*snap, i*snap, (i+1)*snap]`:
    - `scale`: `[0.92, 1, 0.92]` (Extrapolation.CLAMP)
    - `opacity`: `[~0.6, 1, ~0.6]`
    - `translateX`: `[+offset, 0, -offset]` (pull neighbours in)
  - `page` index synced on `onMomentumScrollEnd` (JS thread) → `PaginationDots`.

### 2.4 `HeroCard`
- **Path:** `components/dashboard/HeroCard.tsx`
- **Responsibility:** Premium edge-to-edge hero card. `expo-image` fills the
  card (`contentFit="cover"`, `transition`); `expo-linear-gradient` bottom scrim
  for legibility; radius 24–28 (`borderRadius.xl` = 24); soft elevation
  (`shadows.lg` / `shadows.card`); glass overlay at the bottom. Left column =
  title + subtitle/progress (`submitted_forms`/`total_forms` via existing
  `cardState()`); right = status pill. `cardState()` logic is REUSED verbatim
  (moved into / imported by this component; behavior unchanged). When no image,
  fall back to a `pastelAt(index)` tint with `pastel.accent` title text.
- **Props:**
  ```ts
  import type { DashboardItem } from '@/api/types'
  import type { Pastel } from '@/constants/theme'
  interface HeroCardProps {
    item: DashboardItem
    pastel: Pastel        // pastelAt(index) from the carousel
    onPress: () => void
  }
  ```
- **Status pill mapping (preserve cardState().done):**
  - `done` → bg `colors.background.card` (surface), text `colors.text.primary`.
  - `pending` → bg `colors.brand.primary` (BRAND), text
    `colors.background.primary` (background text).
- **Tokens:** card radius `borderRadius.xl`; elevation `shadows.lg`; image
  fallback bg `pastel.bg`, fallback text `pastel.accent`; overlay title
  `colors.text.inverse` (white-on-scrim is legible-by-design — text sits on the
  dark gradient, so `text.inverse` which is white is the correct token); subtitle
  `colors.text.inverse` at reduced opacity via style `opacity`, NOT a color
  literal; pill colors per mapping above. Scrim = `expo-linear-gradient` with
  `['rgba(0,0,0,0)', 'rgba(0,0,0,a)']` — allowed ONLY as an image scrim for
  legibility, not as a theme color substitute.
- **Animations:** press feedback via `PressableScale` (`activeScale≈0.97`). The
  coverflow scale/opacity/translate is applied by the parent `HeroCarousel`
  wrapper, not here (keeps `HeroCard` presentational).

### 2.5 `PaginationDots`
- **Path:** `components/dashboard/PaginationDots.tsx`
- **Responsibility:** Theme-colored paging indicator. Active dot is wider + BRAND
  (width animated); inactive dots use the border color. Centered row under the
  carousel.
- **Props:**
  ```ts
  interface PaginationDotsProps {
    count: number
    activeIndex: number   // accepts a number; optional SharedValue<number> overload for fully-UI-thread width
    style?: StyleProp<ViewStyle>
  }
  ```
- **Tokens:** active dot bg `colors.brand.primary` (BRAND); inactive dot bg
  `colors.border.default` (or `colors.border.light`); gap from `spacing.xs`.
- **Animations:** each dot's `width` animates via `useAnimatedStyle` +
  `withTiming` (or `withSpring`) on active-index change (active ≈ 18px, inactive
  ≈ 7px). Optionally interpolate dot width directly from a `SharedValue` driven
  by the carousel's `scrollX` for a continuous morph.

## 3. tokenMap (visual element → exact theme token)

| Visual element | Token |
| --- | --- |
| Screen background | `colors.background.primary` |
| Section title | `colors.text.primary` |
| Hero card surface / image-fallback | `pastelAt(i).bg` (fallback) |
| Hero card image-fallback title text | `pastelAt(i).accent` |
| Hero card elevation/shadow | `shadows.lg` (or `shadows.card`) |
| Hero card radius | `borderRadius.xl` (24) |
| Hero overlay title text | `colors.text.inverse` (on dark scrim) |
| Hero overlay subtitle/progress text | `colors.text.inverse` + style opacity |
| Hero image scrim (legibility only) | `expo-linear-gradient` rgba(0,0,0,a) — allowed scrim exception |
| Status pill — pending bg | `colors.brand.primary` (BRAND) |
| Status pill — pending text | `colors.background.primary` |
| Status pill — done bg | `colors.background.card` |
| Status pill — done text | `colors.text.primary` |
| Pagination dot — active | `colors.brand.primary` (BRAND) |
| Pagination dot — inactive | `colors.border.default` |
| Category tab — active bg | `colors.brand.primary` (BRAND) |
| Category tab — active text | `colors.text.inverse` |
| Category tab — inactive bg | `colors.background.secondary` |
| Category tab — inactive text | `colors.text.secondary` |
| Category tab radius | `borderRadius.full` |
| Header greeting (kicker) | `AppHeader` internal (out of scope) |
| Header title | `AppHeader` internal (out of scope) |
| Header avatar | `AppHeader` internal (out of scope) |
| Floating tab-bar background | `colors.background.primary` |
| Floating tab-bar shadow | `shadows.md` |
| Empty / no-results icon + text | `colors.text.tertiary` / `colors.text.secondary` |
| RefreshControl tint | `colors.brand.primary` (BRAND) |
| isDark conditional (any L/D branch) | `isDark` from `useTheme()` |

## 4. Preserve contract (behavior that MUST NOT change)

1. `dashboardService.getContent(signal)` + `useQuery({ queryKey: ['dashboard','content'], retry:false })`.
2. `onRefresh` + `RefreshControl` (refetch; `refreshing` state).
3. `useAuth()` for `user`, `firstName`, avatar.
4. `greetingForNow()` time-of-day logic (Morning/Afternoon/Evening).
5. `HIDDEN_SECTIONS = new Set(['rewards','careers'])` filtering of tabs & sections.
6. Tab filtering by `activeTab` (`'all'` shows all; otherwise `s.key === activeTab`).
7. Section ordering by `meta.tabs` (excluding `'all'`), with the
   `Object.values(sections)` fallback when no ordered match.
8. Social section special-casing (`section.key === 'social'` → brand-icon
   linkable rows; preserved as-is, can move to its own component but behavior
   unchanged).
9. Presentations special card (`section.key === 'presentations'` →
   `PresentationCard` treatment) and single-item centering.
10. `cardState(item)` label/done/subline logic (forms status,
    `submitted_forms`/`total_forms`, `viewed`, default `View`).
11. `openCard` routing: `link_type === 'external'` → `WebBrowser.openBrowserAsync`;
    `item.detail` → `router.push('/(protected)/content/[id]', {...same params...})`;
    fallback internal `item.link` → `WebBrowser`.
12. Loading skeleton (Skeleton/SkeletonCard layout), error empty-state + Retry,
    and the no-results state.
13. Auto-hiding floating tab bar scroll behavior (`scrollHandler`,
    `chipReveal`, settle-to-0/1 on release) — stays in the screen; `CategoryTabs`
    is rendered inside it.
14. `api/types.ts` models (`DashboardItem`, `DashboardSection`, `DashboardTab`,
    `DashboardContentResponse`, etc.) remain unchanged.

## 5. Migration notes

- New folder `components/dashboard/` with the five components + a local barrel,
  re-exported from `components/index.ts`.
- The refactored screen imports `{ DashboardHeader, CategoryTabs, HeroCarousel }`
  (HeroCard + PaginationDots are internal to HeroCarousel) and keeps all query /
  routing / state logic.
- Every hardcoded literal in the current screen and the new files is replaced by
  a `useTheme()` token per the tokenMap. The ONLY allowed literal is `BRAND`
  (prefer `colors.brand.primary`; or `import { BRAND_GREEN as BRAND }`).
- The single permitted exception is the `expo-linear-gradient` scrim using
  `rgba(0,0,0,a)` purely for image legibility — never as a theme color.
- `cardState()`, `greetingForNow()`, `HIDDEN_SECTIONS`, `socialIconFor()` move
  alongside their owning component but keep identical logic.
