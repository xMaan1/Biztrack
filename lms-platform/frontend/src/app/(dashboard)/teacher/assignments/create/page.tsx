'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { useCourses } from '@/lib/hooks/useCourses'
import { useCreateAssignment } from '@/lib/hooks/useAssignments'
import toast from 'react-hot-toast'

export default function CreateAssignmentPage() {
  const router = useRouter()
  const { data: coursesData, isLoading: loadingCourses } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []
  const createAssignment = useCreateAssignment()
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    instructions: '',
    max_score: '100',
    deadline: '',
    is_published: true,
    allow_late_submission: false,
    late_submission_penalty: '0',
    max_file_size: '10485760',
    allowed_file_types: '.pdf,.doc,.docx,.zip',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.course_id) { toast.error('Please select a course'); return }
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.deadline) { toast.error('Deadline is required'); return }

    try {
      await createAssignment.mutateAsync({
        course_id: Number(form.course_id),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        max_score: Number(form.max_score),
        deadline: new Date(form.deadline).toISOString(),
        is_published: form.is_published,
        allow_late_submission: form.allow_late_submission,
        late_submission_penalty: Number(form.late_submission_penalty),
        max_file_size: Number(form.max_file_size),
        allowed_file_types: form.allowed_file_types,
      })
      toast.success('Assignment created')
      router.push('/teacher/assignments')
    } catch {
      toast.error('Failed to create assignment')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Create Assignment</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set up a new assignment for your course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course *</label>
              {loadingCourses ? (
                <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading courses...</div>
              ) : (
                <select
                  value={form.course_id}
                  onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 5 Assignment" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the assignment..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions</label>
              <textarea
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Provide detailed instructions..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Score</label>
                <Input type="number" value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline *</label>
                <Input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max File Size (bytes)</label>
                <Input type="number" value={form.max_file_size} onChange={e => setForm(f => ({ ...f, max_file_size: e.target.value }))} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowed File Types</label>
                <Input value={form.allowed_file_types} onChange={e => setForm(f => ({ ...f, allowed_file_types: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options</label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.allow_late_submission} onChange={e => setForm(f => ({ ...f, allow_late_submission: e.target.checked }))} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow late submissions</span>
              </label>
              {form.allow_late_submission && (
                <div className="ml-7">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Late Submission Penalty (%)</label>
                  <Input type="number" value={form.late_submission_penalty} onChange={e => setForm(f => ({ ...f, late_submission_penalty: e.target.value }))} min={0} max={100} className="max-w-[200px]" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={createAssignment.isPending}>
            {createAssignment.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Assignment
          </Button>
        </div>
      </form>
    </div>
  )
}
