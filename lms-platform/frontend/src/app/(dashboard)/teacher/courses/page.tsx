'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCourses, useDeleteCourse } from '@/lib/hooks/useCourses'
import { Search, Plus, Users, Edit, Trash2, Eye, Video, ClipboardList, Loader2, BookOpen, GraduationCap, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherCourses() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading } = useCourses({ page_size: 50 })
  const deleteCourse = useDeleteCourse()
  const courses = data?.courses ?? []

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course?')) return
    try {
      await deleteCourse.mutateAsync(id)
      toast.success('Course deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your courses and track student progress
          </p>
        </div>
        <Link href="/teacher/courses/create" className="w-full md:w-auto">
          <Button className="flex items-center gap-2 w-full md:w-auto">
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No courses match your search' : 'You have no courses yet'}
            </p>
            {!searchTerm && (
              <Link href="/teacher/courses/create">
                <Button variant="outline" className="mt-3">Create Your First Course</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base md:text-lg truncate">{course.title}</CardTitle>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                    course.is_published
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Users className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto text-gray-500" />
                      <p className="text-xs md:text-sm font-medium mt-1">{course.current_enrollment}</p>
                      <p className="text-[10px] md:text-xs text-gray-500">Students</p>
                    </div>
                    <div className="p-1.5 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto text-gray-500" />
                      <p className="text-xs md:text-sm font-medium mt-1">{course.credits}</p>
                      <p className="text-[10px] md:text-xs text-gray-500">Credits</p>
                    </div>
                    <div className="p-1.5 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto text-gray-500" />
                      <p className="text-xs md:text-sm font-medium mt-1">{course.semester}</p>
                      <p className="text-[10px] md:text-xs text-gray-500">Semester</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href={`/teacher/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-xs md:text-sm">
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/teacher/courses/${course.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full text-xs md:text-sm">
                        <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full sm:w-auto text-red-500 hover:text-red-600" onClick={() => handleDelete(course.id)} disabled={deleteCourse.isPending}>
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
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
