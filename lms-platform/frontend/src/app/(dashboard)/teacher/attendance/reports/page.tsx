'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserCheck, Calendar, BarChart3, Loader2, TrendingUp, Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useCourses } from '@/lib/hooks/useCourses'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import toast from 'react-hot-toast'

interface AttendanceStats {
  course_id: number
  total_sessions: number
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_percentage: number
}

export default function AttendanceReportsPage() {
  const { data: coursesData } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []
  const [selectedCourse, setSelectedCourse] = useState('')
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async (courseId: number) => {
    setLoading(true)
    try {
      const { data } = await apiClient.get(ENDPOINTS.reports.attendanceStats(courseId))
      setStats(data.data as AttendanceStats)
    } catch {
      toast.error('Failed to load attendance stats')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Attendance Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View attendance analytics across your courses</p>
      </div>

      <Card>
        <CardContent className="p-3 md:p-4">
          <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Course</label>
          <div className="flex gap-2">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
            </select>
            <Button onClick={() => selectedCourse && fetchStats(Number(selectedCourse))} disabled={!selectedCourse || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      )}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-blue-500/10"><Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /></div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stats.total_sessions}</p>
                  <p className="text-xs md:text-sm text-gray-500">Total Sessions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-green-500/10"><CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-xs md:text-sm text-gray-500">Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-red-500/10"><XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-xs md:text-sm text-gray-500">Absent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-purple-500/10"><TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" /></div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stats.attendance_percentage}%</p>
                  <p className="text-xs md:text-sm text-gray-500">Attendance Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Attendance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Present', count: stats.present, total: stats.total_records, color: 'bg-green-500' },
                  { label: 'Absent', count: stats.absent, total: stats.total_records, color: 'bg-red-500' },
                  { label: 'Late', count: stats.late, total: stats.total_records, color: 'bg-yellow-500' },
                  { label: 'Excused', count: stats.excused, total: stats.total_records, color: 'bg-purple-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className="text-sm text-gray-500">{item.count} / {item.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className={`${item.color} h-2.5 rounded-full transition-all`} style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !stats && selectedCourse === '' && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a course to view attendance report</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
