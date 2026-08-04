'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { useCreateCourse, useUpdateCourse } from '@/lib/hooks/useCourses'
import { useDepartments } from '@/lib/hooks/useDepartments'
import { useTeachers } from '@/lib/hooks/useTeachers'
import type { CourseCreatePayload } from '@/lib/types/course.types'

interface CourseFormProps {
  initialData?: Partial<CourseCreatePayload>
  courseId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function CourseForm({ initialData, courseId, onSuccess, onCancel }: CourseFormProps) {
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse(courseId || 0)
  const isEditing = !!courseId

  const { data: departments = [] } = useDepartments()

  const [form, setForm] = useState<CourseCreatePayload>({
    title: initialData?.title || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    credits: initialData?.credits || 3,
    department_id: initialData?.department_id || 1,
    teacher_id: initialData?.teacher_id || 1,
    semester: initialData?.semester || 'Fall 2024',
    academic_year: initialData?.academic_year || '2024-2025',
    max_students: initialData?.max_students || 30,
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
  })

  const { data: teachers = [], isLoading: teachersLoading } = useTeachers(form.department_id)

  const filteredTeachers = teachers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.code.trim()) {
      toast.error('Title and course code are required')
      return
    }
    if (!form.department_id) {
      toast.error('Please select a department')
      return
    }
    if (!form.teacher_id) {
      toast.error('Please select a teacher')
      return
    }
    try {
      if (isEditing) {
        await updateCourse.mutateAsync(form)
        toast.success('Course updated')
      } else {
        await createCourse.mutateAsync(form)
        toast.success('Course created')
      }
      onSuccess?.()
    } catch {
      toast.error(isEditing ? 'Failed to update course' : 'Failed to create course')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-3 gap-4">
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
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
          <select
            value={form.department_id}
            onChange={e => setForm(f => ({ ...f, department_id: Number(e.target.value), teacher_id: 0 }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={0}>Select a department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher</label>
          <select
            value={form.teacher_id}
            onChange={e => setForm(f => ({ ...f, teacher_id: Number(e.target.value) }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!form.department_id || teachersLoading}
          >
            <option value={0}>
              {!form.department_id ? 'Select a department first' : teachersLoading ? 'Loading...' : 'Select a teacher'}
            </option>
            {filteredTeachers.map(t => (
              <option key={t.id} value={t.id}>
                {`${t.profile?.first_name || ''} ${t.profile?.last_name || ''}${t.email ? ` (${t.email})` : ''}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
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
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={createCourse.isPending || updateCourse.isPending}>
          {isEditing ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  )
}
