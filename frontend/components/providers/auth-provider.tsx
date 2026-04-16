"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { authService } from "@/services/auth-service"
import type { LoginCredentials, RegisterData, User, UserRole } from "@/lib/types"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  googleLogin: (credential: string) => Promise<User>
  register: (payload: RegisterData) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
])
const AUTH_ROLE_COOKIE = "ms_auth_role"

function defaultRouteForRole(role: UserRole) {
  if (role === "admin") return "/admin"
  if (role === "therapist") return "/therapist"
  return "/dashboard"
}

function matchesRouteSegment(pathname: string, segment: string) {
  return pathname === segment || pathname.startsWith(`${segment}/`)
}

function isProtectedPath(pathname: string) {
  return (
    matchesRouteSegment(pathname, "/dashboard") ||
    matchesRouteSegment(pathname, "/therapist") ||
    matchesRouteSegment(pathname, "/admin")
  )
}

function isAllowedForRole(pathname: string, role: UserRole) {
  if (matchesRouteSegment(pathname, "/admin")) return role === "admin"
  if (matchesRouteSegment(pathname, "/therapist")) return role === "therapist"
  if (matchesRouteSegment(pathname, "/dashboard")) return role === "user"
  return true
}

function syncRoleCookie(role: UserRole | null) {
  if (typeof document === "undefined") return
  if (role) {
    document.cookie = `${AUTH_ROLE_COOKIE}=${role}; Path=/; SameSite=Lax`
    return
  }
  document.cookie = `${AUTH_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleUnauthorized = useCallback(() => {
    setUser(null)
    api.setTokens(null)
    if (isProtectedPath(pathname)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [pathname, router])

  const refreshUser = useCallback(async () => {
    const tokens = api.getTokens()
    if (!tokens?.access) {
      setUser(null)
      setIsLoading(false)
      return null
    }
    try {
      const nextUser = await authService.getCurrentUser()
      setUser(nextUser)
      return nextUser
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorized()
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    refreshUser().catch(() => {
      setIsLoading(false)
    })
  }, [refreshUser])

  useEffect(() => {
    return api.onUnauthorized(() => {
      handleUnauthorized()
    })
  }, [handleUnauthorized])

  useEffect(() => {
    syncRoleCookie(user?.role ?? null)
  }, [user])

  useEffect(() => {
    if (isLoading) return
    if (AUTH_ROUTES.has(pathname) && user) {
      router.replace(defaultRouteForRole(user.role))
      return
    }
    if (isProtectedPath(pathname) && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    if (user && !isAllowedForRole(pathname, user.role)) {
      router.replace(defaultRouteForRole(user.role))
    }
  }, [isLoading, pathname, router, user])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await authService.login(credentials)
    setUser(session.user)
    return session.user
  }, [])

  const googleLogin = useCallback(async (credential: string) => {
    const session = await authService.googleLogin(credential)
    setUser(session.user)
    return session.user
  }, [])

  const register = useCallback(async (payload: RegisterData) => {
    return authService.register(payload)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    router.replace("/login")
  }, [router])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      googleLogin,
      register,
      logout,
      refreshUser,
    }),
    [googleLogin, isLoading, login, logout, refreshUser, user, register]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
