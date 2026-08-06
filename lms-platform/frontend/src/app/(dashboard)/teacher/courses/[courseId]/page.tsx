'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCourse } from '@/lib/hooks/useCourses'
import { useCourseLectures } from '@/lib/hooks/useLectures'
import { BookOpen, Users, ClipboardList, UserCheck, ArrowLeft, Video, FileText, Calendar, Loader2, BarChart3, Edit, Trash2 } from 'lucide-react'

export default function TeacherCourseDetail() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params.courseId)
  const { data: course, isLoading: courseLoading } = useCourse(courseId)
  const { data: lecturesData, isLoading: lecturesLoading } = useCourseLectures(courseId)
  const lectures = lecturesData?.lectures ?? []

  if (courseLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-500">Course not found</p>
        <Button variant="outline" onClick={() => router.push('/teacher/courses')}>Back to Courses</Button>
      </div>
    )
  }

  const stats = [
    { label: 'Students', value: course.current_enrollment, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Lectures', value: lectures.length, icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Assignments', value: '0', icon: ClipboardList, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Attendance', value: '--', icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
  ]

  const tabs = [
    { label: 'Assignments', href: `/teacher/courses/${courseId}/assignments`, icon: FileText },
    { label: 'Attendance', href: `/teacher/courses/${courseId}/attendance`, icon: Calendar },
    { label: 'Lectures', href: `/teacher/courses/${courseId}/lectures`, icon: Video },
    { label: 'Students', href: `/teacher/courses/${courseId}/students`, icon: Users },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/teacher/courses')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{course.code} &mdash; {course.semester} {course.academic_year}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
            {course.is_published ? 'Published' : 'Draft'}
          </span>
          <Link href={`/teacher/courses/${courseId}/edit`}>
            <Button variant="outline" size="sm"><Edit className="w-3.5 h-3.5 mr-1" /> Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className={`p-2 md:p-3 rounded-lg ${s.bg} shrink-0`}>
                <s.icon className={`w-4 h-4 md:w-5 md:h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{String(s.value)}</p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Course Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <div><p className="text-xs font-medium text-gray-500 uppercase">Department</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{course.department_name || 'N/A'}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Teacher</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{course.teacher_name || 'N/A'}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Credits</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{course.credits}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Capacity</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{course.current_enrollment}/{course.max_students}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Start Date</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{course.start_date ? new Date(course.start_date).toLocaleDateString() : 'N/A'}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">End Date</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{course.end_date ? new Date(course.end_date).toLocaleDateString() : 'N/A'}</p></div>
          </div>
          {course.description && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{course.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {tabs.map((tab, i) => (
            <Link key={i} href={tab.href}>
              <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-4 md:p-6 flex items-center gap-3">
                  <div className="p-2 md:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <tab.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">{tab.label}</p>
                    <p className="text-xs text-gray-500">Manage {tab.label.toLowerCase()}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {!lecturesLoading && lectures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Video className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Recent Lectures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lectures.slice(0, 5).map((lecture, idx) => (
                <Link key={lecture.id} href={`/teacher/lectures/${lecture.id}`} className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {String(lecture.lecture_number || idx + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lecture.title}</p>
                    <p className="text-xs text-gray-500">{lecture.is_published ? 'Published' : 'Draft'}</p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
