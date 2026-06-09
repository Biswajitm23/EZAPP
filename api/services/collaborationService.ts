import { apiRequest } from '../apiRequest'
import { ENDPOINTS } from '../endpoints'
import type { CollaborationParams, CollaborationResponse } from '../types'

/**
 * Collaboration ("Collab Days") service.
 */
export const collaborationService = {
  /**
   * Monthly collaboration matrix for the signed-in user.
   *
   * GET /collaboration — Bearer auth, any logged-in role. Optional `month`
   * (1-12) and `year` params; when omitted the backend returns the latest
   * uploaded month. Returns { status, available, month, title,
   * total_office_days, days[] } — `available:false` when no matrix exists for
   * the requested month. Throws on 401 (handled by the interceptor).
   */
  getCollaboration: (
    params?: CollaborationParams,
    signal?: AbortSignal
  ): Promise<CollaborationResponse> =>
    apiRequest<CollaborationResponse>({
      url: ENDPOINTS.collaboration.get,
      method: 'GET',
      // Drop undefined keys so we don't send empty query params.
      params:
        params && (params.month != null || params.year != null)
          ? {
              ...(params.month != null && { month: params.month }),
              ...(params.year != null && { year: params.year }),
            }
          : undefined,
      signal,
    }),
}
