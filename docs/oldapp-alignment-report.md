# OLD APP → EMPAPP Alignment Report

Scope: verify EMPAPP's **JWT auth**, **profile-image update**, and **modal design**
against the reference **OLD APP** (`OLD APP/Archive (12)`). This report documents
the OLD APP pattern, EMPAPP's current state, what matches, and the concrete gaps
worth fixing. It does **not** propose a full re-port — the OLD APP carries a lot of
features (social login, AI summary, jobs, theming) that are out of EMPAPP v1 scope.

---

## 1. Auth / JWT

### OLD APP pattern
- **Axios** (`provider/axios/axiosInstance.tsx`): base instance with a request
  interceptor that reads `auth` from `SecureStore`, parses JSON, and attaches
  `Authorization: Bearer <accessToken>` (only if not already set). A response
  interceptor handles 401:
  - If `data.status === 'ERROR'` and `message === 'Account is no longer active.'`,
    it force-logs-out (`clearAllUserData()` + `setSessionExpired(true)`).
  - Otherwise it does a **single-flight refresh** using module-level `isRefreshing`
    / `refreshPromise` plus a **request queue** (`requestQueue` of
    `{resolve, reject}`). Concurrent 401s wait on the queue; the first request
    runs `POST {baseURL}auth/token/refresh` with body `{ refresh_token }`, reads
    `data.data.access_token` / `data.data.refresh_token` / `data.data.user`,
    dispatches `setAuthDetails`, **awaits** the SecureStore write, then
    `drainQueue(newAccess)` and retries `originalRequest`.
  - On refresh failure: `rejectQueue(err)`, `clearAllUserData()`,
    `setSessionExpired(true)`.
- **Token persistence is centralized in the redux slice**
  (`provider/slices/authSlice.ts`): `setAuthDetails` writes `{accessToken,
  refreshToken, user}` to `SecureStore('auth')` as a side-effect of the reducer;
  `setSessionExpired` / `clearAuthDetails` delete it. `updateProfileImage`
  mutates `user.profile_image_url` and re-persists. `clearAllUserData()` thunk
  also clears badges + AI-summary AsyncStorage keys.
- **Login** (`app/login.tsx`): uses `useApi({url:'auth/login', method:'POST'})`
  (TanStack mutation). Validates with **zod** `loginSchema` (`schemas/authSchemas.ts`),
  calls `mutateAsync({login_type, identifier, value, password, push_token})`,
  then `dispatch(setAuthDetails(...))` with `res.data.access_token /
  refresh_token / user`. Branches on `verification_status`,
  `profile_completion_status`, `terms_accepted` for navigation. Social login
  writes SecureStore directly then dispatches.
- **Refresh endpoint**: `auth/token/refresh`, response shape `data.data.*`.
- **AuthScreen** (`app/auth.tsx`): a swipeable Login/Signup tabbed wrapper
  (Animated + PanGestureHandler). Pure UI host; the auth logic lives in `login.tsx`.

### EMPAPP current state
- **Axios** (`api/axiosInstance.ts`): request interceptor reads `SecureStore('auth')`
  → `Bearer <accessToken>`. Response interceptor on 401: marks
  `original._retry`, calls `refreshAccessToken()`, retries with the new token.
  Refresh logic is **extracted** into `api/refreshToken.ts` (cleaner than OLD APP):
  single-flight via a module `refreshPromise`, uses a **bare axios client**
  (`requestRefresh`) so a refreshing-401 can't recurse, `saveRotatedTokens`
  persists the rotated pair, clears SecureStore on failure.
- **Refresh endpoint**: `ENDPOINTS.auth.refresh = 'refresh'` (NOT
  `auth/token/refresh`), request body `{ refresh_token }`, response read as
  **flat** `data.access_token` / `data.refresh_token` (`RefreshResponse`), NOT
  nested under `data.data`.
- **Persistence** is split out of redux into `helpers/auth.ts`
  (`saveAuth`/`getAuth`/`clearStoredAuth`, key `'auth'`) and orchestrated by
  `hooks/useAuth.ts` (`signIn` persists + dispatches `setAuthDetails`; `signOut`
  calls `authService.logout()` then clears). The redux `authSlice` is a **pure**
  slice (no SecureStore side-effects), with `setAuthDetails`, `setUser`,
  `setSessionExpired`, `clearAuth`.
- **Login** (`app/login.tsx`): local `useState` form + a hand-rolled `validate()`
  (email-required/valid + password-required) — **no zod**. Calls
  `authService.login()` (`api/services/authService.ts`) which POSTs
  `ENDPOINTS.auth.login = 'login'` with `{email, password}` and maps the **flat**
  `LoginResponse` (`access_token`, `refresh_token`, `user.{id, emp_id, full_name,
  email, phone, role, profile_picture}`) into a `LoginResult`. `signIn(result)`
  persists + dispatches; navigates to `/(protected)/(tabs)/dashboard`.
- **Entry gate** (`app/index.tsx`): restores `getAuth()`, dispatches
  `setAuthDetails`, routes signed-in→dashboard / signed-out→login.
- **Protected guard** (`app/(protected)/_layout.tsx`): redirects to `/login` when
  `!isAuthenticated`.

### Matches
- Bearer-token request interceptor reading `SecureStore('auth')` — same key,
  same `{accessToken, refreshToken, user}` shape.
- Auto-refresh on 401 with **single-flight** and rotated-token persistence.
- Refresh request body field name `refresh_token`.
- Redux `authSlice` action names (`setAuthDetails`, `setSessionExpired`) align;
  EMPAPP adds `setUser` / `clearAuth`.
- TanStack-Query-based API layer (`useApi` + `apiRequest`) with the same
  FormData-detection branch (skip JSON `Content-Type` for FormData).
- Login flow: validate → call API → persist tokens+user → dispatch → navigate.

### Gaps
EMPAPP is intentionally a cleaner re-architecture, so the differences below are
either deliberate scope choices or small robustness items. Real items to confirm:

1. **Refresh endpoint + response shape differ — confirm which is correct for the
   Employee Zone backend.** OLD APP uses `auth/token/refresh` and reads
   `data.data.access_token`; EMPAPP (`api/endpoints.ts`, `api/types.ts`) uses
   `refresh` and reads flat `data.access_token`. These describe **two different
   backends** (OLD APP = Young Professionals API). EMPAPP's flat shape matches its
   own documented `/login` contract, so this is expected — but the endpoint path
   and nesting must be verified against the real Employee Zone API before refresh
   can work. (File: `api/endpoints.ts`, `api/refreshToken.ts`, `api/types.ts`.)
2. **No "account no longer active" force-logout branch.** OLD APP's interceptor
   special-cases a deactivated account on 401 and logs out immediately. EMPAPP's
   interceptor (`api/axiosInstance.ts`) only attempts refresh. If the Employee
   Zone backend signals deactivation the same way, add an equivalent early-exit.
   *(Minor — backend-contract dependent.)*
3. **`sessionExpired` is never surfaced to the user.** OLD APP sets
   `sessionExpired` and the profile screen shows a "Session expired" toast then
   routes to auth. EMPAPP has the `setSessionExpired` reducer but nothing
   dispatches it on refresh-failure, and no screen reacts to it — the failed
   refresh just clears SecureStore (`refreshToken.ts`) and the next protected
   render bounces to `/login` via the layout guard. Functionally fine; if you
   want the OLD APP's explicit messaging, dispatch `setSessionExpired(true)` on
   refresh failure and react to it.
4. **Validation is hand-rolled, not zod.** OLD APP uses `loginSchema`
   (`schemas/authSchemas.ts`). EMPAPP's `app/login.tsx` `validate()` covers the
   same required-email/valid-email/required-password cases. This is a deliberate
   simplification (zod isn't a dependency in EMPAPP); **no functional gap** for
   v1, listed only for traceability.

> Net: the EMPAPP auth layer is well-aligned and in places cleaner (extracted
> refresh, pure slice). The only must-do before refresh works end-to-end is
> confirming the refresh **endpoint path + response nesting** with the real API.

---

## 2. Profile-image update

### OLD APP pattern
File: `app/(protected)/(tabs)/profile/components/ProfileContent.tsx`.
- **Picker**: `expo-image-picker`. Separate `pickFromGallery` /
  `pickFromCamera`, each gated by a `requestPermission(...)` helper that checks
  the existing permission, requests if needed, and on denial shows an
  `Alert.alert` with an **"Open Settings"** button (`Linking.openSettings()`).
  Editing on: `allowsEditing: true`, `aspect: [3, 4]`, `quality: 0.7`.
- **Source chooser**: native `Alert.alert('Upload Photo', ...)` with
  Camera/Gallery/Cancel. When a photo already exists, a second
  `Alert.alert('Profile Photo', ...)` offers **Edit / Remove / Cancel**
  (Remove = destructive).
- **Validation before upload** (`uploadImage`): `FileSystem.getInfoAsync(uri)` to
  confirm existence and enforce **< 2 MB**.
- **Upload**: builds `FormData` with field name **`profile_image`**, `{uri, name,
  type: image/<ext>}` (jpg→jpeg). Calls `axiosInstance.post('V1/upload-profile-img',
  formData, { 'Content-Type': 'multipart/form-data', Authorization: Bearer })`
  with a **60 s timeout** and **manual retry (3 attempts, exponential backoff)**
  on network errors.
- **Remove**: posts the same endpoint with `profile_image: ''`.
- **State sync**: on success `dispatch(updateProfileImage(url))` (updates
  `auth.user.profile_image_url` + re-persists SecureStore) and `showToast`.
- `isUploading` drives a spinner on the avatar edit button.

### EMPAPP current state
Files: `helpers/image.ts`, `api/services/profileService.ts`,
`app/(protected)/(tabs)/profile/index.tsx`.
- **Picker** (`helpers/image.ts`): `takeProfilePhoto` / `pickProfilePhoto`,
  `allowsEditing: true`, `aspect: [1, 1]` (square), `quality: 0.7`. Returns a
  **discriminated result** `{status:'ok'|'canceled'|'denied'}` (no try/catch
  needed by caller). On denial it returns `'denied'` — the screen shows a toast
  ("allow access in Settings") but does **not** deep-link to Settings.
- **Source chooser**: themed `ActionSheet` via `useFeedback().sheet({title,
  message, options:[Take Photo, Choose from Library]})` — branded, not native
  `Alert`. **No Remove option.**
- **Upload** (`profileService.uploadProfilePicture`): `FormData` field name
  **`profile_picture`** (OLD APP uses `profile_image`), `{uri, name, type}`,
  POST `ENDPOINTS.profile.picture = 'profile/picture'`, header
  `'Content-Type': 'multipart/form-data'`. No explicit timeout, **no retry**.
- **State sync** (`pictureMutation` in profile `index.tsx`): TanStack mutation;
  `setPhotoPreview(uri)` for instant preview; on success merges
  `res.profile` (or patches `res.profile_picture`) into the `['profile']` query
  cache **and** `dispatch(setUser(...))` with `employeePicUrl(profile_picture)`.
  Avatar shows an overlay `ActivityIndicator` while `pictureMutation.isPending`.

### Matches
- `expo-image-picker` with `allowsEditing` + `quality: 0.7`.
- Permission requested before launching camera/library; denial messaged to the user.
- Multipart `FormData` with a `{uri, name, type}` file object and a
  `multipart/form-data` content type override.
- Optimistic local preview + redux user update + success toast on completion.
- Spinner feedback during upload.

### Gaps
1. **FormData field name mismatch.** EMPAPP sends `profile_picture`; OLD APP
   sends `profile_image`. The Employee Zone backend field is unknown — `endpoints.ts`
   itself flags the route as unconfirmed. **Confirm the field name + route**
   (`profile/picture` vs OLD APP's `V1/upload-profile-img`) with the backend and
   align `profileService.uploadProfilePicture`. *(Real, must-confirm.)*
2. **No client-side size guard.** OLD APP rejects images > 2 MB before upload
   (via `expo-file-system`). EMPAPP uploads whatever the picker returns. Consider
   adding a 2 MB check in `helpers/image.ts` or `uploadProfilePicture`.
   `expo-file-system` is not currently a dependency. *(Optional robustness.)*
3. **No upload timeout / retry.** OLD APP uses a 60 s timeout + 3-attempt
   exponential-backoff on network errors. EMPAPP relies on the axios default
   (20 s) with no retry. For a multipart upload on mobile networks, a longer
   timeout and a small retry are worth adding. *(Optional robustness.)*
4. **No "Remove photo" action.** OLD APP offers Edit/Remove when a photo exists.
   EMPAPP's ActionSheet only offers Take/Choose. Add a destructive "Remove
   Photo" option if the backend supports clearing the picture. *(Optional /
   product decision.)*
5. **Aspect ratio differs (cosmetic).** EMPAPP crops square `[1,1]` (suits the
   circular avatar); OLD APP uses `[3,4]`. EMPAPP's choice is better for a round
   avatar — **not a gap**, noted for awareness.
6. **Permission-denied UX is lighter.** OLD APP deep-links to system Settings;
   EMPAPP only toasts. Optional: add `Linking.openSettings()`.

> Net: the upload flow is functionally aligned and uses a nicer branded chooser.
> The one **must-confirm** is the multipart field name + endpoint; size-guard /
> timeout / retry / remove-photo are quality add-ons.

---

## 3. Modal design

### OLD APP pattern
- **`CustomAlert.tsx`**: a confirm/alert dialog — `Modal` (transparent, fade) +
  `BlurView` backdrop, a card with a tinted **icon circle** (red error tint),
  title, message, and a **two-button row** (Cancel ghost + gradient Confirm). A
  `confirmLoading` prop swaps the Confirm label for a spinner and disables both
  buttons. Theme-aware via `useTheme()`.
- **`EditModal.tsx` / `CustomEditModal.tsx`**: large field-driven edit sheets
  (text/email/phone/date/dropdown/autocomplete/skills), used by ProfileContent's
  `getModalFields()` per section (profile/about/education/skills) with
  `loading`, country-code handling, and async phone-availability checks.
- **`DeleteAccountModal.tsx`**: dedicated destructive-confirm modal.
- Other modals in ProfileContent (QR, fullscreen image) use raw `Modal` +
  `Animated` scale transitions.

### EMPAPP current state
- **`components/ConfirmModal.tsx`**: `Modal` (transparent, fade,
  `statusBarTranslucent`), pressable backdrop (`rgba(11,27,51,0.45)`), white card
  with an optional **icon circle** (brand-green tint `#E7F5EF` / `BRAND_GREEN`),
  title, message, a full-width **green primary** confirm button, and a text
  **cancel** below. `loading` shows a spinner + blocks dismissal; `hideCancel`
  turns it into a single-action alert. Driven through `useFeedback().confirm(...)`
  (used by profile logout).
- **`components/ActionSheet.tsx`**: branded bottom sheet (slide-up), title/
  message header, option rows with optional Ionicon + `destructive` styling, and
  a separate Cancel button. Driven through `useFeedback().sheet(...)`.
- **`components/DatePickerModal.tsx`**: themed date picker (used for DOB).
- There is **no field-driven edit modal**: EMPAPP edits the profile **inline**
  on `profile/index.tsx` (each field is a live input; gender/DOB use
  ActionSheet/DatePicker), diffing changed fields and POSTing only those.

### Matches
- Confirm dialog parity: `ConfirmModal` mirrors `CustomAlert` — transparent fade
  `Modal`, icon circle, title, message, primary + cancel, and a `loading`/
  `confirmLoading` spinner that locks dismissal.
- Destructive styling support (ActionSheet `destructive` option; OLD APP's
  delete/remove flows).
- Bottom action sheet for source selection (parallels OLD APP's `Alert.alert`
  chooser, but branded and reusable).
- Backdrop dismissal, `statusBarTranslucent`, safe-area-aware bottom padding.

### Gaps
1. **No multi-field "Edit" modal (by design).** OLD APP centralizes profile edits
   in `CustomEditModal`; EMPAPP edits **inline** on the profile screen. This is a
   deliberate UX divergence for Employee Zone v1 (simpler, fewer screens) — **not
   a gap to fix**, recorded so the difference is intentional, not overlooked.
2. **Confirm button shape differs (cosmetic).** OLD APP uses a two-button row
   (gradient Confirm + ghost Cancel side-by-side); EMPAPP stacks a pill Confirm
   over a text Cancel. Both convey the same actions; align only if a pixel-match
   to OLD APP is required.
3. **No `BlurView` backdrop.** OLD APP blurs behind `CustomAlert`; EMPAPP uses a
   solid translucent scrim. `expo-blur` is not an EMPAPP dependency. Cosmetic;
   the scrim reads cleanly on the light theme. *(Optional.)*
4. **No dedicated DeleteAccountModal.** Out of EMPAPP v1 scope (no delete-account
   feature). `ConfirmModal` with `hideCancel`/destructive intent already covers
   any future destructive confirm. *(Not needed for v1.)*

> Net: EMPAPP's modal system (`ConfirmModal` + `ActionSheet` + `DatePickerModal`,
> all funneled through `FeedbackProvider`) faithfully covers the OLD APP's
> `CustomAlert` + source-picker patterns. The absence of a `CustomEditModal` is a
> deliberate inline-edit choice, not a missing piece.

---

## Summary of actionable items (vs. cosmetic / by-design)

**Must confirm with backend (real blockers for full functionality):**
- Refresh endpoint path + response nesting (`refresh` flat vs `auth/token/refresh`
  nested) — `api/endpoints.ts`, `api/refreshToken.ts`, `api/types.ts`.
- Profile-picture multipart **field name** (`profile_picture` vs `profile_image`)
  and **route** (`profile/picture` vs `V1/upload-profile-img`) —
  `api/endpoints.ts`, `api/services/profileService.ts`.

**Optional robustness (match OLD APP if desired):**
- Image < 2 MB pre-upload guard (needs `expo-file-system`).
- Upload timeout (~60 s) + small retry on network error.
- "Remove photo" ActionSheet option (+ backend support).
- 401 "account no longer active" force-logout branch; surface `sessionExpired`.
- Permission-denied deep link to Settings (`Linking.openSettings()`).

**By design / cosmetic (no action needed):**
- Hand-rolled login validation instead of zod.
- Square `[1,1]` avatar crop instead of `[3,4]`.
- Inline profile edit instead of `CustomEditModal`.
- Stacked confirm buttons / solid scrim instead of two-button row / `BlurView`.
