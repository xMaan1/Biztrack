import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '../features/landing/page'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { GuestRoute } from '../features/auth/components/GuestRoute'
import { OnboardingRoute } from '../features/auth/components/OnboardingRoute'
import { TenantSetupPage } from '../features/onboarding/pages/TenantSetupPage'
import { DashboardPage } from '../features/dashboard/page'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/onboarding/tenant"
        element={
          <OnboardingRoute>
            <TenantSetupPage />
          </OnboardingRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
