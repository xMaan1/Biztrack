import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LMS Platform - Learning Management System',
  description: 'Comprehensive Learning Management System for educational institutions',
  keywords: 'LMS, education, learning, courses, assignments, attendance',
  authors: [{ name: 'LMS Team' }],
  openGraph: {
    title: 'LMS Platform',
    description: 'Comprehensive Learning Management System',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}