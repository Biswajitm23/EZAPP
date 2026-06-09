/**
 * Central registry of API endpoint paths.
 *
 * Paths are relative to `config.baseUrl` (which already ends in a slash).
 * Keeping them here means you change a route in exactly one place.
<<<<<<< HEAD
=======
 *
 * TODO: replace these placeholder paths with the real Employee Zone API routes.
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
 */
export const ENDPOINTS = {
  auth: {
    login: 'login',
    googleLogin: 'auth/google',
    refresh: 'refresh',
    logout: 'logout',
    me: 'auth/me',
  },
  profile: {
    get: 'profile',
    update: 'profile/update',
    // Multipart upload/remove for the profile photo (field `profile_image`).
    // Upload: send the file. Remove: send an empty string. NOT JSON.
    picture: 'upload-profile-image',
  },
  directory: {
    list: 'employees',
    detail: (id: string | number) => `employees/${id}`,
  },
  // Full bitpoint + incentive history (newest first). Bearer auth. One endpoint
  // feeds both screens — each row carries the bitpoints and incentives values.
  bitpoints: {
    list: 'bitpoints',
  },
<<<<<<< HEAD
  // Monthly collaboration ("Collab Days") matrix. Bearer auth, any logged-in
  // role. Params: { month, year } — both optional (defaults to the latest
  // uploaded month). Returns { status, available, month, title,
  // total_office_days, days[] }; available:false when no matrix exists yet.
  collaboration: {
    get: 'collaboration', // GET (Bearer) — params: { month?, year? }
  },
  // Dashboard content + per-item detail, plus the five mark-done / submit
  // actions. `content` returns all sections (or a single section when a `tab`
  // param is passed); `detail` is discriminated by the `type` query param
  // (returns 422 on an unknown type — services let that throw).
  dashboard: {
    content: 'dashboard/content', // GET (Bearer) — params: { tab? }
    detail: 'dashboard/detail', // GET (Bearer) — params: { type, key?|slug?|id? }
    elearningWatched: 'elearning/watched', // POST { key }
    formSubmit: 'forms/submit', // POST { form_id, signature_image? }
    handbookRead: 'hr-handbook/read', // POST { handbook_id }
    guidelineConfirm: 'guidelines/confirm', // POST { guideline_id, signature_image? }
  },
=======
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
} as const
