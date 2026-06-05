/**
 * Central registry of API endpoint paths.
 *
 * Paths are relative to `config.baseUrl` (which already ends in a slash).
 * Keeping them here means you change a route in exactly one place.
 *
 * TODO: replace these placeholder paths with the real Employee Zone API routes.
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
    // Multipart upload for the profile photo. NOTE: confirm this route with the
    // backend — /profile/update does NOT accept the picture (text fields only).
    picture: 'profile/picture',
  },
  directory: {
    list: 'employees',
    detail: (id: string | number) => `employees/${id}`,
  },
} as const
