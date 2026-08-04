'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMyTeacherApplication, useMyStudentApplication } from '@/lib/hooks/useApplications'
import { BookOpen, GraduationCap, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  submitted: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" />, label: 'Submitted' },
  reviewed: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" />, label: 'Reviewed' },
  selected: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" />, label: 'Rejected' },
}

export default function PublicUserDashboard() {
  const { user } = useAuth()
  const { data: teacherApp } = useMyTeacherApplication()
  const { data: studentApp } = useMyStudentApplication()

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold">Welcome, {user?.full_name || 'User'}!</h1>
        <p className="mt-2 text-blue-100">Apply as a Teacher or Student to get started with the LMS Platform.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/apply/teacher" className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all hover:border-blue-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Apply as Teacher</h3>
              <p className="text-sm text-gray-500">Share your knowledge and teach students</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        <Link href="/apply/student" className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all hover:border-indigo-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Apply as Student</h3>
              <p className="text-sm text-gray-500">Start your learning journey today</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Applications */}
      {(teacherApp || studentApp) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Applications</h2>
          <div className="space-y-3">
            {teacherApp && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Teacher Application</p>
                    <p className="text-sm text-gray-500">Submitted {teacherApp.created_at ? new Date(teacherApp.created_at).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[teacherApp.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {statusConfig[teacherApp.status]?.icon}
                  {statusConfig[teacherApp.status]?.label || teacherApp.status}
                </span>
              </div>
            )}
            {studentApp && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Student Application</p>
                    <p className="text-sm text-gray-500">Submitted {studentApp.created_at ? new Date(studentApp.created_at).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[studentApp.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {statusConfig[studentApp.status]?.icon}
                  {statusConfig[studentApp.status]?.label || studentApp.status}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
