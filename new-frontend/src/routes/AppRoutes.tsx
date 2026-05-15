import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '../features/landing/page'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}