'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEnrollmentStats } from '@/lib/hooks/useAdminDashboard'
import { useCourses } from '@/lib/hooks/useCourses'

export default function EnrollmentReportPage() {
  const [selectedCourse, setSelectedCourse] = useState('')

  const { data: coursesData } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []
  const { data: stats, isLoading } = useEnrollmentStats(selectedCourse ? Number(selectedCourse) : undefined)

  const items = [
    { label: 'Total Enrollments', value: stats?.total_enrollments ?? 0, color: 'text-gray-900 dark:text-white' },
    { label: 'Active', value: stats?.active ?? 0, color: 'text-green-600 dark:text-green-400' },
    { label: 'Completed', value: stats?.completed ?? 0, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Dropped', value: stats?.dropped ?? 0, color: 'text-red-600 dark:text-red-400' },
    { label: 'Pending', value: stats?.pending ?? 0, color: 'text-yellow-600 dark:text-yellow-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enrollment Report</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Student enrollment statistics</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Course</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                ))}
              </select>
            </div>
            {selectedCourse && (
              <Button variant="outline" size="sm" onClick={() => setSelectedCourse('')}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {items.map(s => (
            <Card key={s.label}>
              <CardContent className="p-6 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
