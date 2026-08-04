'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCourse } from '@/lib/hooks/useCourses'
import { useAttendanceSessions, useCreateAttendanceSession } from '@/lib/hooks/useAttendance'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, UserCheck, Calendar, QrCode, Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CourseAttendance() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params.courseId)
  const { data: course } = useCourse(courseId)
  const { data: sessionsData, isLoading } = useAttendanceSessions(courseId ? { course_id: courseId } : {})
  const createSession = useCreateAttendanceSession()
  const sessions = Array.isArray(sessionsData) ? sessionsData : []

  const handleCreateSession = async () => {
    try {
      await createSession.mutateAsync({
        course_id: courseId,
        title: `Attendance - ${new Date().toLocaleDateString()}`,
      })
      toast.success('Attendance session created')
    } catch {
      toast.error('Failed to create session')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/courses/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{course?.title || 'Course'}</p>
          </div>
        </div>
        <Button onClick={handleCreateSession} disabled={createSession.isPending} className="w-full sm:w-auto">
          {createSession.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
          New Session
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No attendance sessions yet</p>
            <Button variant="outline" className="mt-3" onClick={handleCreateSession} disabled={createSession.isPending}>Create First Session</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{s.status}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs md:text-sm text-gray-500">
                      <span>{s.date ? new Date(s.date).toLocaleDateString() : 'No date'}</span>
                      <span>Present: {s.present_count}/{s.total_students}</span>
                      {s.session_code && <span className="font-mono text-primary">Code: {s.session_code}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/teacher/attendance/qr?sessionId=${s.id}`}>
                      <Button variant="outline" size="sm"><QrCode className="w-3.5 h-3.5 mr-1" /> QR</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
