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

/** Response from the profile-picture upload (multipart). */
export interface ProfilePictureResponse {
  status: boolean | number
  message: string
  profile?: ProfileApiData
  profile_picture?: string // stored filename, when returned standalone
}
