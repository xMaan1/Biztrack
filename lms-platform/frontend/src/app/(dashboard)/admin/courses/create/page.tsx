'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, BookOpen, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDuration } from '@/lib/utils/dateHelpers'
import { useCreateCourse } from '@/lib/hooks/useCourses'
import { useDepartments } from '@/lib/hooks/useDepartments'
import { useTeachers } from '@/lib/hooks/useTeachers'
import type { CourseCreatePayload } from '@/lib/types/course.types'

export default function CreateCoursePage() {
  const router = useRouter()
  const createCourse = useCreateCourse()
  const { data: departments } = useDepartments()
  const { data: teachers } = useTeachers()

  const [form, setForm] = useState<CourseCreatePayload>({
    title: '', code: '', description: '', credits: 3,
    department_id: 1, teacher_id: 1, semester: 'Fall 2024',
    academic_year: '2024-2025', max_students: 30,
    start_date: '', end_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.code.trim()) {
      toast.error('Title and course code are required')
      return
    }
    if (!form.start_date || !form.end_date) {
      toast.error('Start and end dates are required')
      return
    }
    if (form.end_date < form.start_date) {
      toast.error('End date must be after start date')
      return
    }
    if (!form.teacher_id) {
      toast.error('Please select a teacher')
      return
    }
    if (!form.department_id) {
      toast.error('Please select a department')
      return
    }
    if (form.credits < 1 || form.credits > 10) {
      toast.error('Credits must be between 1 and 10')
      return
    }
    if (form.max_students < 1) {
      toast.error('Max students must be at least 1')
      return
    }
    try {
      const payload = {
        ...form,
        description: form.description?.trim() || undefined,
      }
      await createCourse.mutateAsync(payload)
      toast.success('Course created successfully')
      router.push('/admin/courses')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | { error?: { message?: string } }; errors?: Array<{ message: string }> } } }
      const msg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : error.response?.data?.detail?.error?.message
          || error.response?.data?.errors?.[0]?.message
          || 'Failed to create course'
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Create Course</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Add a new course to the system</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Course Title</label>
              <Input placeholder="e.g. Introduction to Programming" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Course Code</label>
              <Input placeholder="e.g. CS-101" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" placeholder="Course description..." value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Credits</label>
              <Input type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Max Students</label>
              <Input type="number" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
              <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Fall 2024</option>
                <option>Spring 2024</option>
                <option>Summer 2024</option>
                <option>Fall 2025</option>
                <option>Spring 2025</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: Number(e.target.value) }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {(departments || []).map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher</label>
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
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
              <Input placeholder="e.g. 2024-2025" value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
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
            <Link href="/admin/courses" className="w-full sm:w-auto">
              <Button variant="outline" disabled={createCourse.isPending} className="w-full sm:w-auto">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={createCourse.isPending} className="w-full sm:w-auto">
              {createCourse.isPending ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
