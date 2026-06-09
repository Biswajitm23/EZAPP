import { apiRequest } from '../apiRequest'
import { ENDPOINTS } from '../endpoints'
import type { DashboardContentResponse, GetDetailParams } from '../types'

/**
 * Dashboard service — content, per-item detail, and the five mark-done /
 * submit actions (Employee Zone dashboard scope).
 *
 * Auth is injected centrally by the axios request interceptor, so no service
 * here sets an Authorization header. Detail field names are contract-inferred;
 * callers read defensively and narrow on the `type` they requested. Adjust the
 * types in api/types.ts once live payloads are captured.
 */
export const dashboardService = {
  /**
   * Dashboard content (all sections).
   *
   * GET /dashboard/content — Bearer auth. Returns { status, meta, sections }
   * where `sections` is keyed by section key (iterate in insertion order for
   * API order) and `meta.tabs` drives the category chips. Throws on 401
   * (token missing/invalid) — callers render an error state.
   */
  getContent: (signal?: AbortSignal): Promise<DashboardContentResponse> =>
    apiRequest<DashboardContentResponse>({
      url: ENDPOINTS.dashboard.content,
      method: 'GET',
      signal,
    }),

  /**
   * Per-item detail, discriminated by `type`.
   *
   * GET /dashboard/detail — Bearer auth, `params: { type, key?, slug?, id? }`
   * (undefined identifiers are omitted from the query string). The response
   * shape depends on `type` (e.g. ElearningVideoDetail, FormDetail,
   * HrHandbookDetail, GuidelineDetail, GameDetail, RewardDetail, the
   * Presentation* shapes) — returned loosely typed as `any` so the caller can
   * narrow on the `type` it requested. Throws on 422 (unknown type) — callers
   * render an error state.
   */
  getDetail: (params: GetDetailParams, signal?: AbortSignal): Promise<any> => {
    const { type, key, slug, id } = params
    return apiRequest<any>({
      url: ENDPOINTS.dashboard.detail,
      method: 'GET',
      // Omit undefined identifiers so they don't appear in the query string.
      params: {
        type,
        ...(key !== undefined ? { key } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(id !== undefined ? { id } : {}),
      },
      signal,
    })
  },

  /**
   * Mark an e-learning video as watched.
   *
   * POST /elearning/watched — Bearer auth, body { key }. Flips the dashboard
   * item's `viewed` on the next content fetch; callers invalidate the dashboard
   * query afterwards.
   */
  markElearningWatched: (key: string): Promise<any> =>
    apiRequest<any>({
      url: ENDPOINTS.dashboard.elearningWatched,
      method: 'POST',
      body: { key },
    }),

  /**
   * Submit / mark a form as submitted.
   *
   * POST /forms/submit — Bearer auth. Sends ONLY `form_id` for the current
   * (signature-less Google) forms; `signature_image` (base64/data URI) is
   * included only when a signature is provided.
   */
  submitForm: (form_id: number, signature_image?: string): Promise<any> =>
    apiRequest<any>({
      url: ENDPOINTS.dashboard.formSubmit,
      method: 'POST',
      body: { form_id, ...(signature_image ? { signature_image } : {}) },
    }),

  /**
   * Mark the HR handbook as read.
   *
   * POST /hr-handbook/read — Bearer auth, body { handbook_id }. Idempotent.
   */
  markHandbookRead: (handbook_id: number): Promise<any> =>
    apiRequest<any>({
      url: ENDPOINTS.dashboard.handbookRead,
      method: 'POST',
      body: { handbook_id },
    }),

  /**
   * Confirm a guideline has been read.
   *
   * POST /guidelines/confirm — Bearer auth. Sends `guideline_id`, plus
   * `signature_image` (base64/data URI) only when a signature is provided.
   */
  confirmGuideline: (guideline_id: number, signature_image?: string): Promise<any> =>
    apiRequest<any>({
      url: ENDPOINTS.dashboard.guidelineConfirm,
      method: 'POST',
      body: { guideline_id, ...(signature_image ? { signature_image } : {}) },
    }),
}
