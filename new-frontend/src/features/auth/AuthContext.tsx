import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, loginRequest, logoutRequest, registerRequest } from './api'
import type { LoginRequest, MeResponse, RegisterRequest } from './types'

interface AuthContextValue {
  user: MeResponse | null
  loading: boolean
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<MeResponse | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchMe()
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await refreshUser()
      setLoading(false)
    }

    void init()
  }, [refreshUser])

  const login = useCallback(async (payload: LoginRequest) => {
    await loginRequest(payload)
    await refreshUser()
  }, [refreshUser])

  const register = useCallback(async (payload: RegisterRequest) => {
    await registerRequest(payload)
    await refreshUser()
  }, [refreshUser])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
