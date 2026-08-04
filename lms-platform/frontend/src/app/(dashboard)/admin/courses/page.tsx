'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, Plus, Users, Calendar, Clock, Edit, Trash2, Eye, Loader2 } from 'lucide-react'
import { useCourses, useDeleteCourse, usePublishCourse, useUnpublishCourse } from '@/lib/hooks/useCourses'
import toast from 'react-hot-toast'
import { formatDuration } from '@/lib/utils/dateHelpers'

export default function CoursesManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const deleteCourse = useDeleteCourse()
  const publishCourse = usePublishCourse()
  const unpublishCourse = useUnpublishCourse()

  const { data, isLoading, isError } = useCourses({
    page,
    page_size: 9,
    search: searchTerm || undefined,
  })

  const courses = data?.courses ?? []

  const handleTogglePublish = async (id: number, isPublished: boolean, title: string) => {
    try {
      if (isPublished) {
        await unpublishCourse.mutateAsync(id)
        toast.success(`"${title}" unpublished`)
      } else {
        await publishCourse.mutateAsync(id)
        toast.success(`"${title}" published`)
      }
    } catch {
      toast.error('Failed to update course status')
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      await deleteCourse.mutateAsync(id)
      toast.success('Course deleted successfully')
    } catch {
      toast.error('Failed to delete course')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
            Manage all courses in the system
          </p>
        </div>
        <Link href="/admin/courses/create" className="w-full sm:w-auto">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading courses...</span>
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-red-500 dark:text-red-400">Failed to load courses. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && courses.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-gray-500 dark:text-gray-400">No courses found. Create your first course!</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                  </div>
                  <button
                    onClick={() => handleTogglePublish(course.id, course.is_published, course.title)}
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.current_enrollment} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{course.semester}</span>
                    </div>
                    {course.start_date && course.end_date && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Clock className="w-3 h-3" />
                        {formatDuration(course.start_date, course.end_date)}
                      </span>
                    )}
                  </div>
                  {course.teacher_name && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Teacher: {course.teacher_name}</p>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Link href={`/admin/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/admin/courses/${course.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(course.id, course.title)}
                      disabled={deleteCourse.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {courses.length} of {data.total} courses
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            {Array.from({ length: data.total_pages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={p === page ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
