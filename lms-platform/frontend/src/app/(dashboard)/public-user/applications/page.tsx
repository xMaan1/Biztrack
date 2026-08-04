'use client'

import { useMyTeacherApplication, useMyStudentApplication } from '@/lib/hooks/useApplications'
import Link from 'next/link'
import { BookOpen, GraduationCap, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, FileText } from 'lucide-react'

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  submitted: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" />, label: 'Submitted' },
  reviewed: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" />, label: 'Reviewed' },
  selected: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" />, label: 'Rejected' },
}

export default function ApplicationsPage() {
  const { data: teacherApp, isLoading: loading1 } = useMyTeacherApplication()
  const { data: studentApp, isLoading: loading2 } = useMyStudentApplication()
  const loading = loading1 || loading2

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  const hasApplications = teacherApp || studentApp

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>

      {!hasApplications ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
          <p className="text-gray-500 mb-6">You haven&apos;t submitted any applications yet. Apply as a teacher or student to get started.</p>
          <div className="flex justify-center gap-4">
            <Link href="/apply/teacher" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Apply as Teacher</Link>
            <Link href="/apply/student" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Apply as Student</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {teacherApp && (
            <Link href="/public-user/applications/teacher" className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><BookOpen className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Teacher Application</h3>
                    <p className="text-sm text-gray-500">Submitted {teacherApp.created_at ? new Date(teacherApp.created_at).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[teacherApp.status]?.color}`}>
                    {statusConfig[teacherApp.status]?.icon}
                    {statusConfig[teacherApp.status]?.label}
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              {teacherApp.rejection_reason && teacherApp.status === 'rejected' && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300"><strong>Rejection Reason:</strong> {teacherApp.rejection_reason}</p>
                </div>
              )}
            </Link>
          )}
          {studentApp && (
            <Link href="/public-user/applications/student" className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-indigo-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Student Application</h3>
                    <p className="text-sm text-gray-500">Submitted {studentApp.created_at ? new Date(studentApp.created_at).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[studentApp.status]?.color}`}>
                    {statusConfig[studentApp.status]?.icon}
                    {statusConfig[studentApp.status]?.label}
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              {studentApp.rejection_reason && studentApp.status === 'rejected' && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300"><strong>Rejection Reason:</strong> {studentApp.rejection_reason}</p>
                </div>
              )}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
