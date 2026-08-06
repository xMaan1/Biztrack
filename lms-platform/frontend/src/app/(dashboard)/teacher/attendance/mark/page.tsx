'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserCheck, Clock, Loader2, CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react'
import { useCourses } from '@/lib/hooks/useCourses'
import { useAttendanceSessions, useAttendanceRecords, useMarkAttendance } from '@/lib/hooks/useAttendance'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

function extractError(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (!d) return fallback
  if (typeof d.detail === 'string') return d.detail
  if (d.detail && typeof d.detail === 'object') {
    const e = (d.detail as Record<string, unknown>).error
    if (e && typeof e === 'object' && typeof (e as Record<string, unknown>).message === 'string')
      return (e as Record<string, unknown>).message as string
  }
  if (typeof d.message === 'string') return d.message
  return fallback
}

export default function MarkAttendancePage() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

  const { data: coursesData, isLoading: loadingCourses } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []

  const { data: sessionsData, isLoading: loadingSessions } = useAttendanceSessions(
    selectedCourseId ? { course_id: selectedCourseId, page_size: 50 } : {}
  )
  const sessions = Array.isArray(sessionsData) ? sessionsData : []

  const { data: recordsData, isLoading: loadingRecords } = useAttendanceRecords(selectedSessionId ?? 0)
  const records = Array.isArray(recordsData) ? recordsData : []

  const markAttendanceMutation = useMarkAttendance(selectedSessionId ?? 0)

  const markAttendance = async (studentId: number, status: string) => {
    try {
      await markAttendanceMutation.mutateAsync({ studentId, status })
      toast.success(`Marked ${status}`)
    } catch (err) {
      toast.error(extractError(err, 'Failed to mark attendance'))
    }
  }

  const getSessionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      lecture: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      lab: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      tutorial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      exam: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    }
    return colors[type] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a course and session to mark student attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Search className="w-4 h-4" />
              Select Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No courses found</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCourseId(c.id); setSelectedSessionId(null) }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      selectedCourseId === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <p className="font-medium">{c.title}</p>
                    <p className={cn('text-xs mt-0.5', selectedCourseId === c.id ? 'text-primary-foreground/70' : 'text-gray-400')}>{c.code}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {selectedCourseId ? 'Attendance Sessions' : 'Select a course first'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCourseId ? (
              <p className="text-sm text-gray-500 text-center py-8">Choose a course from the left to see its sessions</p>
            ) : loadingSessions ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No sessions found for this course. Create one in the QR Generator first.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                      selectedSessionId === s.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.date ? new Date(s.date).toLocaleDateString() : '--'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{s.present_count}/{s.total_students}</span>
                        {s.session_type && <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getSessionTypeBadge(s.session_type))}>{s.session_type}</span>}
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedSessionId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Student Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecords ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No records loaded. Enrolled students will appear once marked or when records are synced.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {records.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {r.student_name || `Student #${r.student_id}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                            r.status === 'present'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : r.status === 'absent'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : r.status === 'late'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : r.status === 'excused'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          )}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={r.status === 'present' ? 'default' : 'outline'}
                              onClick={() => markAttendance(r.student_id, 'present')}
                              disabled={markAttendanceMutation.isPending}
                              className="flex items-center gap-1"
                            >
                              {markAttendanceMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={r.status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => markAttendance(r.student_id, 'absent')}
                              disabled={markAttendanceMutation.isPending}
                              className="flex items-center gap-1"
                            >
                              {markAttendanceMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              Absent
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
