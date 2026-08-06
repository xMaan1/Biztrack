'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface EnrollmentManagerProps {
  courseId: number
  onRefresh?: () => void
}

export function EnrollmentManager({ courseId, onRefresh }: EnrollmentManagerProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEnroll = async () => {
    if (!studentId.trim()) {
      toast.error('Enter a student ID')
      return
    }
    setLoading(true)
    try {
      await apiClient.post(ENDPOINTS.enrollments.create, {
        course_id: courseId,
        student_id: Number(studentId),
      })
      toast.success('Student enrolled')
      setShowAdd(false)
      setStudentId('')
      onRefresh?.()
    } catch {
      toast.error('Failed to enroll student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setShowAdd(true)}>
        <UserPlus className="w-4 h-4 mr-1" />
        Enroll Student
      </Button>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Enroll Student">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the student ID to enroll in this course.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
            <input
              type="number"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleEnroll} disabled={loading}>
              {loading ? 'Enrolling...' : 'Enroll'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
