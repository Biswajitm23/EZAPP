import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest } from './apiRequest'

interface ApiItem {
  key: any[]
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  params?: any
  headers?: any
  enabled?: boolean
}

/**
 * Generic data hook built on TanStack Query.
 *
 *   // GET (query)
 *   const { data, isLoading } = useApi({ key: ['profile'], url: 'profile' })
 *
 *   // POST/PUT/DELETE (mutation)
 *   const updateProfile = useApi({ key: ['profile'], url: 'profile', method: 'PUT' })
 *   updateProfile.mutate({ name: 'New name' })
 */
export const useApi = <T = any>(options: ApiItem) => {
  const { key, url, method = 'GET', enabled = true, body, params, headers } = options

  // ---------- GET ----------
  if (method === 'GET') {
    return useQuery<T>({
      queryKey: key,
      enabled,
      queryFn: () =>
        apiRequest<T>({
          url,
          params,
          headers: { 'Content-Type': 'application/json', ...headers },
        }),
    })
  }

  // ---------- MUTATION (POST / PUT / PATCH / DELETE) ----------
  return useMutation<T, any, any>({
    mutationFn: (payload) => {
      const bodyData = payload ?? body
      const isFormData = bodyData instanceof FormData
      const requestHeaders = isFormData
        ? { ...headers }
        : { 'Content-Type': 'application/json', ...headers }

      return apiRequest<T>({
        url,
        method,
        body: bodyData,
        headers: requestHeaders,
      })
    },
  })
}
