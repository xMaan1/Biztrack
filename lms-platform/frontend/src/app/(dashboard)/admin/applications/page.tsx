'use client'

import Link from 'next/link'
import { useTeacherApplicationStats, useStudentApplicationStats } from '@/lib/hooks/useApplications'
import { BookOpen, GraduationCap, Clock, Eye, CheckCircle, XCircle } from 'lucide-react'

export default function AdminApplicationsPage() {
  const { data: teacherStats, isLoading: loading1 } = useTeacherApplicationStats()
  const { data: studentStats, isLoading: loading2 } = useStudentApplicationStats()

  const loading = loading1 || loading2

  const stats = [
    { label: 'Teacher Applications', value: teacherStats?.total || 0, icon: BookOpen, color: 'bg-blue-100 text-blue-600', href: '/admin/applications/teachers' },
    { label: 'Student Applications', value: studentStats?.total || 0, icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600', href: '/admin/applications/students' },
    { label: 'Pending Review', value: (teacherStats?.submitted || 0) + (studentStats?.submitted || 0), icon: Clock, color: 'bg-yellow-100 text-yellow-600', href: '/admin/applications/teachers' },
    { label: 'Reviewed', value: (teacherStats?.reviewed || 0) + (studentStats?.reviewed || 0), icon: Eye, color: 'bg-purple-100 text-purple-600', href: '/admin/applications/teachers' },
    { label: 'Approved', value: (teacherStats?.selected || 0) + (studentStats?.selected || 0), icon: CheckCircle, color: 'bg-green-100 text-green-600', href: '/admin/applications/teachers' },
    { label: 'Rejected', value: (teacherStats?.rejected || 0) + (studentStats?.rejected || 0), icon: XCircle, color: 'bg-red-100 text-red-600', href: '/admin/applications/teachers' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications Management</h1>
        <p className="text-gray-500 mt-1">Review and manage teacher and student applications</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/applications/teachers" className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><BookOpen className="w-6 h-6 text-blue-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Teacher Applications</h3>
                <p className="text-sm text-gray-500">View and manage all teacher applications</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600 transition-colors">&rarr;</span>
          </div>
        </Link>
        <Link href="/admin/applications/students" className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-indigo-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Student Applications</h3>
                <p className="text-sm text-gray-500">View and manage all student applications</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
