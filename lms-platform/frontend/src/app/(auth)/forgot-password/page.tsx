'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email'); return }
    setError('')
    setLoading(true)
    try {
      await apiClient.post(ENDPOINTS.auth.forgotPassword, { email: email.trim() })
      setSent(true)
      toast.success('Reset link sent to your email')
    } catch (err: any) {
      const msg = err?.response?.data?.detail?.error?.message || err?.response?.data?.detail || 'Failed to send reset link'
      setError(msg)
      toast.error(msg)
    } finally { setLoading(false) }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 md:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Check Your Email</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We&apos;ve sent a password reset link to <strong className="text-gray-700 dark:text-gray-300">{email}</strong>. Please check your inbox and follow the instructions.
            </p>
            <p className="text-xs text-gray-400">Didn&apos;t receive the email? Check your spam folder or try again.</p>
            <Button variant="outline" onClick={() => { setSent(false); setEmail('') }} className="mt-2">
              Try Again
            </Button>
            <div className="pt-2">
              <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl">Forgot Password?</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                error={error}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
