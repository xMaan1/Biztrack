'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, ShieldCheck, GraduationCap, BookOpen, Users } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter your email or ID'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

type RoleKey = 'admin' | 'teacher' | 'student'

const ROLES: Array<{
  key: RoleKey
  label: string
  id: string
  email: string
  password: string
  icon: typeof ShieldCheck
  color: string
}> = [
  {
    key: 'admin',
    label: 'Admin',
    id: 'EMP-001',
    email: 'admin@lms.com',
    password: 'Admin@1234',
    icon: ShieldCheck,
    color: 'from-rose-500 to-pink-600',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    id: 'EMP-002',
    email: 'hifza@lms.com',
    password: 'Teacher@1234',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-600',
  },
  {
    key: 'student',
    label: 'Student',
    id: 'STU-001',
    email: 'faizan@lms.com',
    password: 'Student@1234',
    icon: GraduationCap,
    color: 'from-emerald-500 to-teal-600',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [role, setRole] = useState<RoleKey>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const activeRole = ROLES.find((r) => r.key === role)!

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.identifier, data.password)
      toast.success('Login successful!')
      router.push('/')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const useDemoAccount = (id: string, password: string) => {
    setValue('identifier', id)
    setValue('password', password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sign in to the Learning Management System
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-sm font-medium transition-all',
                  role === r.key
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-white',
                    role === r.key ? r.color : 'from-gray-300 to-gray-400'
                  )}
                >
                  <r.icon className="h-4.5 w-4.5" size={18} />
                </span>
                {r.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email or {role === 'student' ? 'Student ID' : 'Employee ID'}
              </label>
              <Input
                type="text"
                placeholder={activeRole.id}
                {...register('identifier')}
                error={errors.identifier?.message}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {activeRole.label} example: {activeRole.id} or {activeRole.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign in as ${activeRole.label}`
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">
              Demo accounts - tap to fill (login with your ID)
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => useDemoAccount(r.id, r.password)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
                    role === r.key
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                    <r.icon className="h-4 w-4 text-primary" />
                    {r.label}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {r.id} / {r.password}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
