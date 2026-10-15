import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { env } from '@/config/env'
import type { ApiError } from '@/types'

type ApiErrorBody = {
  message?: string
  code?: string
  error?: {
    message?: string
    code?: string
  }
  detail?: string
}

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 90_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let currentAuthToken: string | null = null
let currentIdentityEmail: string | null = null

/**
 * Signed-in user's e-mail, sent as X-Sales-User-Email on every request.
 * Development (AUTH_MODE=header) uses it as the identity; in production
 * (AUTH_MODE=entra) the server ignores it and trusts only the bearer token.
 */
export function setUserIdentity(email: string | null | undefined) {
  currentIdentityEmail = email?.trim() || null
}

/** Bearer token for fetch-based clients (same token the axios client uses). */
export function getAuthToken(): string | null {
  return currentAuthToken
}

export function setAuthToken(token: string | null) {
  currentAuthToken = token
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common.Authorization
  }
}

function extractErrorMessage(error: AxiosError<ApiErrorBody>): string {
  const data = error.response?.data
  const nested =
    data?.error?.message ||
    data?.message ||
    (typeof data?.detail === 'string' ? data.detail : undefined)
  if (nested) return nested
  if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message)) {
    return 'The request took too long. Dataverse UAT can be slow — please try again.'
  }
  return error.message || 'An unexpected error occurred'
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Axios inherits the instance-wide application/json default for every request.
    // Remove it for FormData so the browser/Axios can set multipart/form-data
    // with the required boundary. Without this, FastAPI may not receive `file`.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers.delete('Content-Type')
    }

    if (currentIdentityEmail) config.headers.set('X-Sales-User-Email', currentIdentityEmail)
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const apiError = new Error(extractErrorMessage(error)) as Error & ApiError
    apiError.code = error.response?.data?.error?.code ?? error.response?.data?.code
    apiError.status = error.response?.status
    return Promise.reject(apiError)
  },
)
