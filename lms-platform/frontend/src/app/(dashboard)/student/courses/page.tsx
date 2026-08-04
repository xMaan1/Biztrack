'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BookOpen, Search, User, Calendar, Users, Loader2 } from 'lucide-react'
import { useAvailableCourses, useEnrollInCourse } from '@/lib/hooks/useEnrollments'
import toast from 'react-hot-toast'

export default function NewCourses() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: courses, isLoading } = useAvailableCourses(searchTerm || undefined)
  const enrollMutation = useEnrollInCourse()

  const handleEnroll = async (courseId: number) => {
    try {
      await enrollMutation.mutateAsync(courseId)
      toast.success('Successfully enrolled in course!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string | { error?: { message?: string } } } } })?.response?.data?.detail
      const errorMsg = typeof msg === 'string' ? msg : msg?.error?.message || 'Failed to enroll'
      toast.error(errorMsg)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">New Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse and enroll in available courses
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">{course.title}</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">{course.credits}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Credits</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{course.teacher_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{course.semester} {course.academic_year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.current_enrollment}/{course.max_students}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollMutation.isPending && enrollMutation.variables === course.id}
                    >
                      {enrollMutation.isPending && enrollMutation.variables === course.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Enroll Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Courses Available</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            There are no new courses available for enrollment at the moment
          </p>
        </div>
      )}
    </div>
  )
}
