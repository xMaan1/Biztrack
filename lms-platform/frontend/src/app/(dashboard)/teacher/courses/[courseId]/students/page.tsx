'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCourse } from '@/lib/hooks/useCourses'
import { useCourseEnrollments, useRemoveEnrollment } from '@/lib/hooks/useEnrollments'
import { ArrowLeft, Search, Users, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CourseStudents() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params.courseId)
  const { data: course } = useCourse(courseId)
  const { data: studentsData, isLoading } = useCourseEnrollments(courseId)
  const removeEnrollment = useRemoveEnrollment()
  const students = studentsData ?? []
  const [search, setSearch] = useState('')

  const filtered = students.filter(s => {
    const name = (s.student_name || '').toLowerCase()
    const email = (s.course_title || '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || email.includes(q)
  })

  const handleRemove = async (enrollmentId: number) => {
    if (!confirm('Remove this student from the course?')) return
    try {
      await removeEnrollment.mutateAsync(enrollmentId)
      toast.success('Student removed')
    } catch { toast.error('Failed to remove student') }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/courses/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{course?.title || 'Course'} &mdash; {students.length} enrolled</p>
          </div>
        </div>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{students.length === 0 ? 'No students enrolled yet' : 'No students match your search'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{s.student_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : '--'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{s.completion_percentage ?? 0}%</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleRemove(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" disabled={removeEnrollment.isPending}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
