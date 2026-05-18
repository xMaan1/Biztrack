import { Spin } from 'antd'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../AuthContext'

export function OnboardingRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user && !user.needs_tenant_setup) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
