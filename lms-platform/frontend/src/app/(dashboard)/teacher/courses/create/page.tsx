'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useCreateCourse } from '@/lib/hooks/useCourses'
import toast from 'react-hot-toast'

interface Department {
  id: number
  name: string
  code: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const createCourse = useCreateCourse()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [form, setForm] = useState({
    title: '',
    code: '',
    description: '',
    credits: '3',
    department_id: '',
    semester: 'Fall',
    academic_year: '2026',
    max_students: '40',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    apiClient.get(ENDPOINTS.departments.list)
      .then(res => setDepartments(res.data.data?.departments ?? res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingDepts(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.code.trim()) { toast.error('Course code is required'); return }
    if (!form.department_id) { toast.error('Select a department'); return }
    if (!form.start_date || !form.end_date) { toast.error('Start and end dates are required'); return }
    if (form.end_date < form.start_date) { toast.error('End date must be after start date'); return }
    if (Number(form.credits) < 1 || Number(form.credits) > 10) { toast.error('Credits must be between 1 and 10'); return }
    if (Number(form.max_students) < 1) { toast.error('Max students must be at least 1'); return }

    try {
      await createCourse.mutateAsync({
        title: form.title.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        credits: Number(form.credits),
        department_id: Number(form.department_id),
        teacher_id: 0,
        semester: form.semester,
        academic_year: form.academic_year,
        max_students: Number(form.max_students),
        start_date: form.start_date,
        end_date: form.end_date,
      })
      toast.success('Course created')
      router.push('/teacher/courses')
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
    <div className="space-y-4 md:space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Create Course</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set up a new course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to CS" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Code *</label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CS-101" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Course description..." rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credits</label>
                <Input type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} min={1} max={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Students</label>
                <Input type="number" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: e.target.value }))} min={1} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                {loadingDepts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 h-10"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                ) : (
                  <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">Select</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Fall</option>
                  <option>Spring</option>
                  <option>Summer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} placeholder="2026" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={createCourse.isPending}>
            {createCourse.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Course
          </Button>
        </div>
      </form>
    </div>
  )
}
