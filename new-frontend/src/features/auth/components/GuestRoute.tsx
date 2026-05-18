import { Spin } from 'antd'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../AuthContext'

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (isAuthenticated && user?.needs_tenant_setup) {
    return <Navigate to="/onboarding/tenant" replace />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
