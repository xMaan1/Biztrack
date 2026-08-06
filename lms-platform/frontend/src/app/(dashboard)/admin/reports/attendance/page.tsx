'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useCourses } from '@/lib/hooks/useCourses'

interface AttendanceStats {
  total_sessions: number
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_percentage: number
}

export default function AttendanceReportPage() {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: coursesData } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []

  const fetchStats = useCallback(async () => {
    if (!selectedCourse) return
    setLoading(true)
    try {
      const res = await apiClient.get(ENDPOINTS.reports.attendanceStats(Number(selectedCourse)))
      setStats(res.data.data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [selectedCourse])

  useEffect(() => { fetchStats() }, [fetchStats])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Report</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track attendance patterns by course</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose a course...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && !selectedCourse && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a course to view attendance statistics.</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedCourse && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_sessions}</p>
              <p className="text-sm text-gray-500 mt-1">Total Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.total_records}</p>
              <p className="text-sm text-gray-500 mt-1">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {`${stats.attendance_percentage.toFixed(1)}%`}
              </p>
              <p className="text-sm text-gray-500 mt-1">Attendance Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && selectedCourse && !stats && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No attendance data available for this course.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
