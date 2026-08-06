'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  role: string
  full_name: string
  profile_picture_url?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
  role?: string
  department_id?: number
}

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@lms.com': {
    password: 'Admin@1234',
    user: { id: 1, email: 'admin@lms.com', role: 'admin', full_name: 'System Administrator' },
  },
  'EMP-001': {
    password: 'Admin@1234',
    user: { id: 1, email: 'admin@lms.com', role: 'admin', full_name: 'System Administrator' },
  },
  'hifza@lms.com': {
    password: 'Teacher@1234',
    user: { id: 2, email: 'hifza@lms.com', role: 'teacher', full_name: 'Hifza Teacher' },
  },
  'EMP-002': {
    password: 'Teacher@1234',
    user: { id: 2, email: 'hifza@lms.com', role: 'teacher', full_name: 'Hifza Teacher' },
  },
  'faizan@lms.com': {
    password: 'Student@1234',
    user: { id: 3, email: 'faizan@lms.com', role: 'student', full_name: 'Faizan Student' },
  },
  'STU-001': {
    password: 'Student@1234',
    user: { id: 3, email: 'faizan@lms.com', role: 'student', full_name: 'Faizan Student' },
  },
  'user@lms.com': {
    password: 'User@1234',
    user: { id: 4, email: 'user@lms.com', role: 'public_user', full_name: 'Public User' },
  },
}

function mockLookup(identifier: string) {
  return MOCK_USERS[identifier.trim()] || MOCK_USERS[identifier.trim().toLowerCase()]
}

let backendAvailable: boolean | null = null

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`,
      { method: 'GET', signal: AbortSignal.timeout(3000) }
    )
    backendAvailable = res.ok
  } catch {
    backendAvailable = false
  }
  return backendAvailable
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token')
    const storedUser = localStorage.getItem(process.env.NEXT_PUBLIC_USER_KEY || 'user')

    if (token && storedUser) {
      // Check if token is a mock token but backend is available
      if (token.startsWith('mock_token_')) {
        checkBackend().then(available => {
          if (available) {
            // Backend is available but we have mock tokens - clear them
            localStorage.removeItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token')
            localStorage.removeItem(process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token')
            localStorage.removeItem(process.env.NEXT_PUBLIC_USER_KEY || 'user')
            setIsLoading(false)
          } else {
            try {
              setUser(JSON.parse(storedUser))
            } catch {
              localStorage.removeItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token')
              localStorage.removeItem(process.env.NEXT_PUBLIC_USER_KEY || 'user')
            }
            setIsLoading(false)
          }
        })
      } else {
        // Real token - validate it by calling /users/me
        apiClient.get(ENDPOINTS.users.me).then(res => {
          const userData = res.data.data
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role || 'student',
            full_name: userData.profile?.full_name || userData.full_name || userData.email,
            profile_picture_url: userData.profile?.profile_picture_url || userData.profile_picture_url,
          })
          localStorage.setItem(process.env.NEXT_PUBLIC_USER_KEY || 'user', JSON.stringify({
            id: userData.id,
            email: userData.email,
            role: userData.role || 'student',
            full_name: userData.profile?.full_name || userData.full_name || userData.email,
          }))
        }).catch(() => {
          // Token invalid - clear
          localStorage.removeItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token')
          localStorage.removeItem(process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token')
          localStorage.removeItem(process.env.NEXT_PUBLIC_USER_KEY || 'user')
        }).finally(() => setIsLoading(false))
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (identifier: string, password: string) => {
    const useBackend = await checkBackend()

    if (!useBackend) {
      const mock = mockLookup(identifier)
      if (!mock || mock.password !== password) {
        throw new Error('Invalid email/ID or password')
      }
      const mockToken = 'mock_token_' + Date.now()
      localStorage.setItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token', mockToken)
      localStorage.setItem(process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token', 'mock_refresh')
      localStorage.setItem(process.env.NEXT_PUBLIC_USER_KEY || 'user', JSON.stringify(mock.user))
      setUser(mock.user)
      return
    }

    try {
      const response = await apiClient.post(ENDPOINTS.auth.login, { email: identifier, password })
      const { access_token, refresh_token, user: userData } = response.data.data

      localStorage.setItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token', access_token)
      localStorage.setItem(process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token', refresh_token)
      localStorage.setItem(process.env.NEXT_PUBLIC_USER_KEY || 'user', JSON.stringify(userData))

      setUser(userData)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | { error?: { message?: string } } } } }
      const msg = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : err.response?.data?.detail?.error?.message || 'Login failed'
      throw new Error(msg)
    }
  }

  const logout = () => {
    localStorage.removeItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token')
    localStorage.removeItem(process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token')
    localStorage.removeItem(process.env.NEXT_PUBLIC_USER_KEY || 'user')
    setUser(null)
    router.push('/login')
    toast.success('Logged out successfully')
  }

  const register = async (data: RegisterData) => {
    const useBackend = await checkBackend()

    if (!useBackend) {
      const newUser: User = {
        id: Date.now(),
        email: data.email,
        role: data.role || 'student',
        full_name: `${data.first_name} ${data.last_name}`,
      }
      MOCK_USERS[data.email] = {
        password: data.password,
        user: newUser,
      }
      return
    }

    try {
      const response = await apiClient.post(ENDPOINTS.auth.register, data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.users.me)
      const userData = res.data.data
      const refreshed: User = {
        id: userData.id,
        email: userData.email,
        role: userData.role || 'student',
        full_name: userData.profile?.full_name || userData.full_name || userData.email,
        profile_picture_url: userData.profile?.profile_picture_url || userData.profile_picture_url,
      }
      setUser(refreshed)
      localStorage.setItem(process.env.NEXT_PUBLIC_USER_KEY || 'user', JSON.stringify(refreshed))
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
