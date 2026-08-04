'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCourse } from '@/lib/hooks/useCourses'
import { useActiveLiveSessions } from '@/lib/hooks/useLiveSessions'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, BookOpen, FileText, Loader2, Radio, Video } from 'lucide-react'
import Link from 'next/link'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params?.courseId)
  const { data: course, isLoading } = useCourse(courseId)
  const { data: activeSessions } = useActiveLiveSessions()

  const courseLiveSessions = (activeSessions || []).filter(s => s.course_id === courseId)

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  if (!course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card><CardContent className="p-8 text-center"><p className="text-gray-500">Course not found</p></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
        {course.description && <p className="text-gray-500 dark:text-gray-400">{course.description}</p>}
        <p className="text-xs text-gray-400">Code: {course.code}</p>
      </div>

      {/* Active live sessions */}
      {courseLiveSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-red-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Live Sessions
          </h2>
          {courseLiveSessions.map(session => (
            <Link key={session.id} href={`/student/live-lecture/${session.id}`}>
              <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20 hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <Radio className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{session.title}</p>
                    {session.description && <p className="text-xs text-gray-500 mt-0.5">{session.description}</p>}
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white shrink-0">
                    <Video className="w-4 h-4 mr-1" /> Join
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/student/my-courses/${courseId}/lectures`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600">Lectures</p>
                <p className="text-xs text-gray-500">View course lectures and materials</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/student/my-courses/${courseId}/materials`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600">Materials</p>
                <p className="text-xs text-gray-500">Downloadable course materials</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Course info */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Course Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Code</p>
              <p className="font-medium text-gray-900 dark:text-white">{course.code}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-gray-900 dark:text-white">{course.is_published ? 'Published' : 'Draft'}</p>
            </div>
            {course.start_date && (
              <div>
                <p className="text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(course.start_date).toLocaleDateString()}</p>
              </div>
            )}
            {course.end_date && (
              <div>
                <p className="text-gray-500">End Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(course.end_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}