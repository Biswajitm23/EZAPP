/**
 * Shared API types.
 *
 * Adjust these to match the actual Employee Zone API response shapes once the
 * backend contract is finalised.
 */

// Most CodeIgniter-style APIs wrap payloads like { status, message, data }.
export interface ApiResponse<T> {
  status?: boolean | number
  message?: string
  data: T
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface Employee {
  id: string | number
  emp_id?: string
  name: string
  email: string
  role?: string
  designation?: string
  department?: string
  phone_number?: string
  profile_image_url?: string
}

export interface UserProfile extends Employee {
  // Add any profile-only fields here (e.g. address, joining_date, etc.)
  joining_date?: string
  about?: string
}

export interface LoginPayload {
  email: string
  password: string
}

/** `user` object returned by POST /login. */
export interface LoginApiUser {
  id: string | number
  emp_id: string
  full_name: string
  email: string
  phone: string
  role: string
  profile_picture: string | null
}

/** Full response from POST /login. */
export interface LoginResponse {
  status: boolean | number
  message: string
  token_type: string // "Bearer"
  access_token: string // use as Bearer; lasts 60 min
  refresh_token: string // store safely; lasts 60 days
  expires_in: number // access token lifetime (sec)
  refresh_expires_in: number // refresh token lifetime (sec)
  token?: string // = access_token (backward-compat)
  user: LoginApiUser
}

export interface LoginResult {
  user: UserProfile
  accessToken: string
  refreshToken: string
  /** "Bearer" — token scheme from the login response. */
  tokenType?: string
  /** Access token lifetime in seconds (login `expires_in`). */
  expiresIn?: number
  /** Refresh token lifetime in seconds (login `refresh_expires_in`). */
  refreshExpiresIn?: number
}

/**
 * Response from POST /refresh. The old refresh token is rotated out — the new
 * `refresh_token` returned here must be saved.
 */
export interface RefreshResponse {
  status: boolean | number
  access_token: string
  refresh_token: string
  token_type: string // "Bearer"
  expires_in: number // access token lifetime (sec)
  refresh_expires_in: number // refresh token lifetime (sec)
}

/**
 * Response from POST /logout. The server clears the stored webpush id and
 * acknowledges; the access token itself stays valid until expiry, so the app
 * must also delete the token locally (see useAuth.signOut).
 */
export interface LogoutResponse {
  status: boolean | number
  message: string
}

/* -------------------------------------------------------------------------- */
/* Profile GET API ( GET /profile )                                           */
/* -------------------------------------------------------------------------- */

/** Employee profile as returned by the Profile GET endpoint. */
export interface ProfileApiData {
  id: string | number
  emp_id: string
  fname: string
  lname: string
  full_name: string
  email: string
  phone: string
  gender: string
  dob: string // YYYY-MM-DD
  join_date: string // YYYY-MM-DD
  address: string
  designation: string
  emp_type: string
  role: string
  profile_picture: string | null
}

/** Assigned manager (null when the employee has no assigned manager). */
export interface ProfileManager {
  id: string | number
  name: string
  email: string
  phone: string
  profile_picture: string | null
}

/** Full response from GET /profile. */
export interface ProfileResponse {
  status: boolean | number
  profile: ProfileApiData
  manager: ProfileManager | null
}

/* -------------------------------------------------------------------------- */
/* Profile UPDATE API ( POST /profile/update )                                */
/* -------------------------------------------------------------------------- */

/**
 * Partial update body — send ONLY the fields being changed. Editable fields:
 * fname, lname, phone, address, gender, dob. email / emp_id / designation /
 * role are NOT editable. `dob` is YYYY-MM-DD.
 */
export interface ProfileUpdatePayload {
  fname?: string
  lname?: string
  phone?: string
  address?: string
  gender?: string
  dob?: string // YYYY-MM-DD
}

/** The editable profile fields, as a non-optional shape for form state. */
export type EditableProfile = Required<ProfileUpdatePayload>

/**
 * Response from POST /profile/update — echoes the full updated profile.
 * Errors: 422 (invalid dob / empty name / no fields), 401 (token missing/invalid).
 */
export interface ProfileUpdateResponse {
  status: boolean | number
  message: string
  profile: ProfileApiData
}

/**
 * Response from the profile-image upload/remove (multipart, POST
 * /upload-profile-image). On upload, `profile_picture` is the stored filename
 * and `profile_picture_url` the full URL; on remove, both are "".
 */
export interface ProfilePictureResponse {
  status: boolean | number
  message: string
  profile?: ProfileApiData
  profile_picture?: string // stored filename ("" when removed)
  profile_picture_url?: string // full URL ("" when removed)
}

/* -------------------------------------------------------------------------- */
/* Bitpoints API ( GET /bitpoints )                                           */
/* -------------------------------------------------------------------------- */

/**
 * A single bitpoint / incentive history entry. The backend field names aren't
 * finalised, so the screen reads defensively (points ?? balance ?? amount,
 * month ?? date, description ?? reason). Adjust once the contract is confirmed.
 */
export interface BitpointRow {
  id?: string | number
  /** Issue period — e.g. issue_month "3" or "March", issue_year "2026". */
  issue_month?: string | number
  issue_year?: string | number
  /** Running cumulative cash earned via bitpoints (Bitpoints page value). */
  cumulative_cash_via_bitpoints?: string | number
  /** Incentive value for the period (Incentives page value). */
  incentives?: string | number
  // Legacy / fallback field names (read defensively):
  month?: string
  date?: string
  points?: string | number
  balance?: string | number
  amount?: string | number
  description?: string
  reason?: string
  type?: string
}

/**
 * Full response from GET /bitpoints — `bitpoints` is newest-first. Each row
 * carries both the bitpoints value (`cumulative_cash_via_bitpoints`) and the
 * `incentives` value, so the same endpoint feeds both the Bitpoints and
 * Incentives screens.
 */
export interface BitpointsResponse {
  status: boolean | number
  count: number
  bitpoints: BitpointRow[]
}

/* -------------------------------------------------------------------------- */
/* Collaboration ("Collab Days") API ( GET /collaboration )                   */
/* -------------------------------------------------------------------------- */

/** A single collaboration day in the monthly matrix. */
export interface CollaborationDay {
  /** ISO date, e.g. "2026-06-02". */
  date: string
  /** Short weekday, e.g. "Tue". */
  weekday: string
  /** Status label, e.g. "Working Day" / "Working Day (Tester Day)". */
  status: string
  /** Work-station / seat count for the day. */
  ws: number
  /** Assigned room, e.g. "Room 19". */
  room: string
}

/**
 * Full response from GET /collaboration (Bearer). `available` is false when no
 * matrix has been uploaded for the requested month — render the empty state.
 * `month` is "YYYY-MM"; `days` is in ascending date order.
 */
export interface CollaborationResponse {
  status: boolean | number
  available: boolean
  month: string // "YYYY-MM"
  title: string
  total_office_days: number
  days: CollaborationDay[]
}

/** Optional month/year filter for GET /collaboration (defaults to latest). */
export interface CollaborationParams {
  month?: number
  year?: number
}

/* -------------------------------------------------------------------------- */
/* Dashboard content / detail API ( GET /dashboard/content , /dashboard/detail )*/
/* -------------------------------------------------------------------------- */

/** A category tab in the dashboard top bar (e.g. { key:'all', title:'All' }). */
export interface DashboardTab {
  key: string
  title: string
}

/**
 * Reference an item carries so the detail screen can fetch it. The `type`
 * selects the detail shape; one of `key | slug | id` identifies the record
 * (which one depends on `type`).
 */
export interface DashboardDetailRef {
  type: string
  key?: string
  slug?: string
  id?: string | number
}

/** A single dashboard card. `viewed` is tri-state: true/false = tracked & (un)done; null = not tracked. */
export interface DashboardItem {
  key: string
  title: string
  image: string // absolute URL
  link: string // absolute URL
  link_type: 'internal' | 'external'
  viewed: boolean | null
  label: string
  // Compliance "Forms" card extras:
  status?: string // e.g. 'Pending' | 'Submitted'
  total_forms?: number
  submitted_forms?: number
  detail?: DashboardDetailRef
  // Forward-compatible extras the backend may add.
  [k: string]: any
}

/** A dashboard section (one per category). `count` = items.length per the contract. */
export interface DashboardSection {
  key: string
  title: string
  tracks_viewed: boolean
  count: number
  items: DashboardItem[]
}

export interface DashboardMeta {
  user_type: string
  asset_base_url: string
  tabs: DashboardTab[]
}

/** Full response from GET /dashboard/content. `sections` is keyed by section key (iterate in insertion order for API order). */
export interface DashboardContentResponse {
  status: boolean | number
  meta: DashboardMeta
  sections: Record<string, DashboardSection>
}

/* -- Detail shapes (read defensively; uncertain fields optional). ---------- */
/* Field names are contract-inferred — services return the raw payload and the */
/* caller narrows on the `type` it requested; adjust once a live response is   */
/* captured (project precedent: bitpointsService / RewardsView read defensively).*/

/** A single language option for an e-learning video. `embed` is iframe HTML. */
export interface ElearningVideoLanguage {
  key?: string
  code?: string
  label?: string
  title?: string
  embed?: string
  watched?: boolean
  [k: string]: any
}

/** The action descriptor the live payload carries for marking a video watched. */
export interface MarkWatchedAction {
  method?: string
  endpoint?: string
  body?: { key?: string; [k: string]: any }
  [k: string]: any
}

/**
 * type='elearning_video' (param: key). The LIVE response is wrapped — this is
 * the UNWRAPPED `item` payload. `languages[].embed` is iframe HTML; `url_en` /
 * `url_bn` are single-language iframe-HTML fallbacks when `languages` is absent.
 */
export interface ElearningVideoDetail {
  status?: boolean | number
  title?: string
  key?: string
  watched?: boolean
  languages?: ElearningVideoLanguage[]
  url_en?: string
  url_bn?: string
  mark_watched?: MarkWatchedAction
  [k: string]: any
}

/**
 * One row in a form_list. The LIVE payload uses `name` (not `title`) and ships a
 * bare `image` filename to be resolved against the dashboard `asset_base_url`
 * (admin/uploads/form_images/<image>). `form_id`/`id` may both appear — read
 * whichever is present.
 */
export interface FormListItem {
  form_id?: number
  id?: number | string
  /** LIVE payload field. Older/contract code may have used `title` instead. */
  name?: string
  title?: string
  slug_name?: string
  /** Bare filename (e.g. "1635770967317.jpg") — resolve via asset_base_url. */
  image?: string
  link?: string
  available_for?: string // "Employee" | "All" | ...
  form_type?: string // "form"
  signature_required?: string | boolean // "no" | "yes"
  submitted?: boolean
  detail?: DashboardDetailRef
  [k: string]: any
}

/** type='form_list'. Forms may arrive under `forms` or `items` — read defensively. */
export interface FormListDetail {
  status?: boolean | number
  forms?: FormListItem[]
  items?: FormListItem[]
  total_forms?: number
  submitted_forms?: number
  [k: string]: any
}

/** type='form' (param: slug). `signature_required` may be a string ('yes') or boolean. */
export interface FormDetail {
  status?: boolean | number
  form_id?: number
  title?: string
  form_type?: string
  signature_required?: string | boolean
  needs_signature?: boolean
  embed_url?: string // Google Form
  file_url?: string // PDF
  submit?: any
  [k: string]: any
}

/** type='hr_handbook' (no param). */
export interface HrHandbookDetail {
  status?: boolean | number
  title?: string
  version?: string
  file_url?: string // PDF
  handbook_id?: number
  watched?: boolean
  [k: string]: any
}

/** type='guideline' (param: slug). Content may arrive as `content`/`html` or a `file_url`. */
export interface GuidelineDetail {
  status?: boolean | number
  guideline_id?: number
  title?: string
  image?: string
  content?: string
  html?: string
  file_url?: string
  viewed?: boolean
  [k: string]: any
}

/** type='game' — read-only content. */
export interface GameDetail {
  status?: boolean | number
  title?: string
  image?: string
  content?: string
  html?: string
  [k: string]: any
}

/** type='reward' — read-only content. */
export interface RewardDetail {
  status?: boolean | number
  title?: string
  image?: string
  content?: string
  html?: string
  [k: string]: any
}

/** A single downloadable presentation PDF. */
export interface PresentationPdf {
  id?: number
  title?: string
  file_url?: string
  [k: string]: any
}

/** A presentation topic grouping one or more PDFs. */
export interface PresentationTopic {
  id?: number
  title?: string
  pdfs?: PresentationPdf[]
  [k: string]: any
}

/** type='presentation_topics'. Topics may arrive under `topics` or `data`. */
export interface PresentationTopicsDetail {
  status?: boolean | number
  topics?: PresentationTopic[]
  data?: PresentationTopic[]
  [k: string]: any
}

/** type='presentation' — a single topic plus its PDFs. */
export interface PresentationDetail {
  status?: boolean | number
  topic?: PresentationTopic
  pdfs?: PresentationPdf[]
  [k: string]: any
}

/** type='presentation_pdf' — a single PDF (the `file_url` may be on `pdf` or top-level). */
export interface PresentationPdfDetail {
  status?: boolean | number
  pdf?: PresentationPdf
  file_url?: string
  [k: string]: any
}

/** Params accepted by getDetail — `type` plus the one identifier its type needs. */
export interface GetDetailParams {
  type: string
  key?: string
  slug?: string
  id?: string | number
}
