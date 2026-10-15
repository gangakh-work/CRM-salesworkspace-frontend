import { STORAGE_KEYS } from '@/config/constants'
import { MOCK_USER } from '@/features/auth/constants/mock-user'
import type { User } from '@/types'

export function getStoredAuthFlag(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.isAuthenticated) === 'true'
  } catch {
    return false
  }
}

export function setStoredAuthFlag(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEYS.isAuthenticated, 'true')
    } else {
      localStorage.removeItem(STORAGE_KEYS.isAuthenticated)
    }
  } catch {
    /* storage unavailable */
  }
}

export function getStoredRememberMe(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.rememberMe) === 'true'
  } catch {
    return true
  }
}

export function setStoredRememberMe(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.rememberMe, String(value))
  } catch {
    /* storage unavailable */
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setStoredUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
  } catch {
    /* storage unavailable */
  }
}

export function persistSession(rememberMe: boolean): User {
  setStoredAuthFlag(true)
  setStoredRememberMe(rememberMe)
  setStoredUser(MOCK_USER)
  return MOCK_USER
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.isAuthenticated)
    localStorage.removeItem(STORAGE_KEYS.user)
    localStorage.removeItem(STORAGE_KEYS.rememberMe)
  } catch {
    /* storage unavailable */
  }
}

export function restoreSession(): { isAuthenticated: boolean; user: User | null; rememberMe: boolean } {
  const isAuthenticated = getStoredAuthFlag()
  const rememberMe = getStoredRememberMe()
  const user = isAuthenticated ? (getStoredUser() ?? MOCK_USER) : null

  return { isAuthenticated, user, rememberMe }
}
