import { apiRequest } from '../apiRequest'
import { ENDPOINTS } from '../endpoints'
import { requestRefresh, saveRotatedTokens } from '../refreshToken'
import { employeePicUrl } from '@/helpers'
import type {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  LoginResult,
  LogoutResponse,
  RefreshResponse,
} from '../types'

export const authService = {

  login: async (payload: LoginPayload): Promise<LoginResult> => {
    const res = await apiRequest<LoginResponse>({
      url: ENDPOINTS.auth.login,
      method: 'POST',
      body: payload,
    })
    const u = res.user
    return {
      // access_token: Bearer, 60 min. (token is a backward-compat alias.)
      accessToken: res.access_token ?? res.token ?? '',
      // refresh_token: 60 days. Stored by signIn; the axiosInstance 401
      // interceptor uses it to auto-refresh + rotate. See ENDPOINTS.auth.refresh.
      refreshToken: res.refresh_token ?? '',
      user: {
        id: u.id,
        emp_id: u.emp_id,
        name: u.full_name,
        email: u.email,
        phone_number: u.phone,
        role: u.role,
        profile_image_url: employeePicUrl(u.profile_picture),
      },
    }
  },

  /** Exchange a Google id_token / auth code for app tokens. */
  googleLogin: async (idToken: string): Promise<LoginResult> => {
    const res = await apiRequest<ApiResponse<any>>({
      url: ENDPOINTS.auth.googleLogin,
      method: 'POST',
      body: { id_token: idToken },
    })
    const data = res?.data ?? res
    return {
      user: data.user,
      accessToken: data.access_token ?? data.accessToken,
      refreshToken: data.refresh_token ?? data.refreshToken,
    }
  },

  /**
   * Refresh an expired access token. POST /refresh with the refresh token in
   * the body. The backend ROTATES the refresh token — the new `refresh_token`
   * returned here must be saved (the auto-refresh interceptor in
   * axiosInstance.ts does this). Errors: 422 (missing), 401 (invalid/expired/
   * revoked).
   *
   * Note: the response interceptor performs refresh-on-401 automatically using
   * a bare request (to avoid interceptor recursion); call this directly only
   * for an explicit/manual refresh.
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await requestRefresh(refreshToken)
    // Rotate: the old refresh token is now invalid — persist the new pair.
    await saveRotatedTokens(res.access_token, res.refresh_token)
    return res
  },

  /**
   * Log out the current session.
   *
   * POST /logout — Bearer auth, any logged-in role, no body. The server clears
   * the user's stored webpush id and returns { status, message }. Throws on 401
   * (token missing/invalid).
   *
   * NOTE: the access token stays valid until it expires — the server does not
   * revoke it. The app MUST also delete the token locally; useAuth.signOut()
   * clears the secure-store session + redux state regardless of this call's
   * outcome.
   */
  logout: (): Promise<LogoutResponse> =>
    apiRequest<LogoutResponse>({
      url: ENDPOINTS.auth.logout,
      method: 'POST',
    }),
}
