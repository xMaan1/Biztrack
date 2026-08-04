'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Users, Calendar, Clock, Loader2, Globe, EyeOff } from 'lucide-react'
import { useCourse, usePublishCourse, useUnpublishCourse } from '@/lib/hooks/useCourses'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils/dateHelpers'
import toast from 'react-hot-toast'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params?.id)

  const { data: course, isLoading, isError } = useCourse(courseId)
  const publishCourse = usePublishCourse()
  const unpublishCourse = useUnpublishCourse()

  const handleTogglePublish = async () => {
    if (!course) return
    try {
      if (course.is_published) {
        await unpublishCourse.mutateAsync(course.id)
        toast.success('Course unpublished')
      } else {
        await publishCourse.mutateAsync(course.id)
        toast.success('Course published')
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-500 dark:text-gray-400">Course not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/courses')}>Back to Courses</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/courses')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
          <button
            onClick={handleTogglePublish}
            disabled={publishCourse.isPending || unpublishCourse.isPending}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1 ${
              course.is_published
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:ring-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 hover:ring-yellow-400'
            }`}
            title={course.is_published ? 'Click to unpublish' : 'Click to publish'}
          >
            {course.is_published ? 'Published' : 'Draft'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePublish}
            disabled={publishCourse.isPending || unpublishCourse.isPending}
            className="w-full sm:w-auto"
          >
            {course.is_published ? <EyeOff className="w-4 h-4 mr-1" /> : <Globe className="w-4 h-4 mr-1" />}
            {course.is_published ? 'Unpublish' : 'Publish'}
          </Button>
          <Link href={`/admin/courses/${course.id}/edit`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Edit Course</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Course Code</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.code}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Credits</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.credits}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Department</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.department_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Teacher</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.teacher_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Semester</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.semester}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Academic Year</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.academic_year}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Start Date</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.start_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">End Date</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.end_date || 'N/A'}</p>
                </div>
              </div>
              {course.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{course.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{course.current_enrollment} / {course.max_students}</p>
                  <p className="text-xs text-gray-500">Enrolled Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{course.semester}</p>
                  <p className="text-xs text-gray-500">Semester</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.start_date && course.end_date
                      ? formatDuration(course.start_date, course.end_date)
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
