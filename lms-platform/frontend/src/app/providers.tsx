'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { NotificationProvider } from '@/lib/context/NotificationContext'
import { useNotificationSocket } from '@/lib/hooks/useNotificationSocket'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'

function NotificationSocketInit() {
  useNotificationSocket()
  return null
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return (
    <>
      {isAuthenticated && <NotificationSocketInit />}
      {children}
    </>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AuthGate>
              {children}
            </AuthGate>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
