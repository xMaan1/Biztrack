'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, BookOpen, Loader2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDuration } from '@/lib/utils/dateHelpers'
import { useCourse, useUpdateCourse } from '@/lib/hooks/useCourses'
import { useDepartments } from '@/lib/hooks/useDepartments'
import { useTeachers } from '@/lib/hooks/useTeachers'
import type { CourseCreatePayload } from '@/lib/types/course.types'

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params?.id)

  const { data: course, isLoading: courseLoading } = useCourse(courseId)
  const updateCourse = useUpdateCourse(courseId)
  const { data: departments } = useDepartments()
  const { data: teachers } = useTeachers()

  const [form, setForm] = useState<CourseCreatePayload>({
    title: '', code: '', description: '', credits: 3,
    department_id: 1, teacher_id: 1, semester: 'Fall 2024',
    academic_year: '2024-2025', max_students: 30,
    start_date: '', end_date: '',
  })

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title,
        code: course.code,
        description: course.description || '',
        credits: course.credits,
        department_id: course.department_id,
        teacher_id: course.teacher_id,
        semester: course.semester,
        academic_year: course.academic_year,
        max_students: course.max_students,
        start_date: course.start_date,
        end_date: course.end_date,
      })
    }
  }, [course])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.code.trim()) {
      toast.error('Title and course code are required')
      return
    }
    try {
      await updateCourse.mutateAsync(form)
      toast.success('Course updated successfully')
      router.push(`/admin/courses/${courseId}`)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | { error?: { message?: string } } } } }
      const msg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : error.response?.data?.detail?.error?.message || 'Failed to update course'
      toast.error(msg)
    }
  }

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-500">Course not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/courses')}>Back to Courses</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/courses/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{course.code} — {course.title}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Code</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credits</label>
              <Input type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Students</label>
              <Input type="number" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
              <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Fall 2024</option>
                <option>Spring 2024</option>
                <option>Summer 2024</option>
                <option>Fall 2025</option>
                <option>Spring 2025</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: Number(e.target.value) }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {(departments || []).map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher</label>
              <select value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: Number(e.target.value) }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value={0}>Select a teacher...</option>
                {(teachers || []).map(t => (
                  <option key={t.id} value={t.id}>{t.profile ? `${t.profile.first_name} ${t.profile.last_name}` : t.email}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
              <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          {form.start_date && form.end_date && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Course duration: <strong>{formatDuration(form.start_date, form.end_date) || 'Invalid dates'}</strong>
              </span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push(`/admin/courses/${courseId}`)} disabled={updateCourse.isPending}>
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={updateCourse.isPending}>
              {updateCourse.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
