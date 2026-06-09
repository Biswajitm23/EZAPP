import { apiRequest } from '../apiRequest'
import { ENDPOINTS } from '../endpoints'
import type {
  ApiResponse,
  Employee,
  ProfileResponse,
  ProfileUpdatePayload,
  ProfileUpdateResponse,
  ProfilePictureResponse,
} from '../types'

/**
 * Profile + Directory service (Employee Zone v1 scope).
<<<<<<< HEAD
=======
 *
 * TODO: align field mapping with the real backend contract.
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
 */
export const profileService = {
  /**
   * Current signed-in user's profile.
   *
   * GET /profile — Bearer auth, any logged-in role. Returns { status, profile,
   * manager }. `manager` is null when no manager is assigned; dob / join_date
   * are YYYY-MM-DD strings. Throws on 401 (token missing/invalid) and 404
   * (profile not found) — callers handle those.
   */
  getProfile: (signal?: AbortSignal): Promise<ProfileResponse> =>
    apiRequest<ProfileResponse>({
      url: ENDPOINTS.profile.get,
      method: 'GET',
      signal,
    }),

  /**
   * Partial profile update.
   *
   * POST /profile/update — Bearer auth. Send ONLY the changed fields (fname,
   * lname, phone, address, gender, dob). Returns { status, message, profile }
   * with the full updated profile. Throws on 422 (invalid dob / empty name /
   * no fields) and 401 (token missing/invalid).
   */
  updateProfile: (payload: ProfileUpdatePayload): Promise<ProfileUpdateResponse> =>
    apiRequest<ProfileUpdateResponse>({
      url: ENDPOINTS.profile.update,
      method: 'POST',
      body: payload,
    }),

  /**
   * Upload a new profile picture (multipart/form-data, field `profile_image`).
   *
   * POST /upload-profile-image (Bearer). `uri` is a local file URI from the
   * picker/camera — must be a square (1:1) JPG/PNG/WebP/GIF ≤ 5 MB. Returns
   * { status, message, profile_picture (filename), profile_picture_url (URL) }.
   * Errors: 422 (not an image / wrong type / > 5 MB / not square / field
   * missing), 401 (token missing/invalid), 500 (upload dir not writable).
   */
  uploadProfilePicture: (uri: string): Promise<ProfilePictureResponse> => {
    const name = uri.split('/').pop() || `profile_${Date.now()}.jpg`
    const ext = name.split('.').pop()?.toLowerCase()
    const type =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg'

    const form = new FormData()
    // React Native's FormData accepts a { uri, name, type } file object.
    form.append('profile_image', { uri, name, type } as any)

    return apiRequest<ProfilePictureResponse>({
      url: ENDPOINTS.profile.picture,
      method: 'POST',
      body: form,
      // Override the instance default (application/json); RN appends the
      // multipart boundary when the body is a FormData object.
      headers: { 'Content-Type': 'multipart/form-data' },
      // Multipart image uploads on mobile networks can exceed the 20s instance
      // default; give them a 60s window (matches the OLD APP upload timeout).
      timeout: 60000,
    })
  },

  /**
   * Remove the current profile picture.
   *
   * POST /upload-profile-image with `profile_image` set to an empty string
   * (multipart, NOT JSON). Returns the same shape with `profile_picture` and
   * `profile_picture_url` set to "".
   */
  removeProfilePicture: (): Promise<ProfilePictureResponse> => {
    const form = new FormData()
    form.append('profile_image', '')

    return apiRequest<ProfilePictureResponse>({
      url: ENDPOINTS.profile.picture,
      method: 'POST',
      body: form,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },

  /** Employee directory listing (optionally searchable). */
  getDirectory: async (search?: string): Promise<Employee[]> => {
    const res = await apiRequest<ApiResponse<Employee[]>>({
      url: ENDPOINTS.directory.list,
      method: 'GET',
      params: search ? { search } : undefined,
    })
    return res?.data ?? (res as any) ?? []
  },

  /** A single employee's public details. */
  getEmployee: async (id: string | number): Promise<Employee> => {
    const res = await apiRequest<ApiResponse<Employee>>({
      url: ENDPOINTS.directory.detail(id),
      method: 'GET',
    })
    return res?.data ?? (res as any)
  },
}
