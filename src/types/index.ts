export interface User {
  id: string
  displayName: string
  email: string
  role: string
  department: string
  initials: string
  roles: string[]
}

export interface SessionInfo {
  isAuthenticated: boolean
  rememberMe: boolean
  user: User | null
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
