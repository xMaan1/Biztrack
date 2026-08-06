'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Search, Filter, UserPlus, Trash2, Eye, Pencil, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { Student, UsersResponse, CreateUserRequest } from '@/lib/types/user.types'

const ITEMS_PER_PAGE = 5

function extractError(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (!d) return fallback
  if (typeof d.detail === 'string') return d.detail
  if (d.detail && typeof d.detail === 'object') {
    const e = (d.detail as Record<string, unknown>).error
    if (e && typeof e === 'object' && typeof (e as Record<string, unknown>).message === 'string')
      return (e as Record<string, unknown>).message as string
  }
  if (Array.isArray(d.errors) && d.errors.length > 0) {
    const first = d.errors[0] as Record<string, unknown>
    if (typeof first.message === 'string') return first.message
  }
  if (typeof d.message === 'string') return d.message
  return fallback
}

export default function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [addForm, setAddForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    department_id: 1, student_number: '', phone: '',
  })

  const [editForm, setEditForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    department_id: 1, student_number: '', is_active: true,
  })

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        skip: String((currentPage - 1) * ITEMS_PER_PAGE),
        limit: String(ITEMS_PER_PAGE),
      })
      if (searchTerm) params.set('search', searchTerm)

      const res = await apiClient.get(`${ENDPOINTS.users.students}?${params}`)
      const data: UsersResponse = res.data.data
      setStudents(data.users as Student[])
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load students:', err)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const handleAddStudent = async () => {
    if (!addForm.first_name.trim() || !addForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    try {
      const payload: CreateUserRequest = {
        email: addForm.email,
        password: addForm.password || 'Student@123',
        role: 'student',
        department_id: addForm.department_id,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        phone: addForm.phone,
        student_number: addForm.student_number,
      }
      await apiClient.post(ENDPOINTS.users.create, payload)
      toast.success('Student added successfully')
      setShowAddModal(false)
      setAddForm({ first_name: '', last_name: '', email: '', password: '', department_id: 1, student_number: '', phone: '' })
      fetchStudents()
    } catch (err: unknown) {
      toast.error(extractError(err, 'Failed to add student'))
    }
  }

  const handleEditStudent = async () => {
    if (!editStudent) return
    setEditing(true)
    try {
      await apiClient.put(ENDPOINTS.users.update(editStudent.id), {
        email: editForm.email,
        department_id: editForm.department_id,
        is_active: editForm.is_active,
        profile: {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
          student_id: editForm.student_number,
        },
      })
      toast.success('Student updated')
      setEditStudent(null)
      fetchStudents()
    } catch {
      toast.error('Failed to update student')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return
    setDeleting(true)
    try {
      await apiClient.delete(ENDPOINTS.users.delete(deleteStudent.id))
      toast.success('Student deleted')
      setDeleteStudent(null)
      fetchStudents()
    } catch {
      toast.error('Failed to delete student')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const getName = (s: Student) => s.profile ? `${s.profile.first_name} ${s.profile.last_name}` : s.email

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} students enrolled</p>
          </div>
        </div>
        <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setCurrentPage(1) }} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">GPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">No students found.</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {getName(s).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{getName(s)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.student_record?.student_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.department_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{s.student_record?.gpa?.toFixed(2) || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewStudent(s)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => { setEditStudent(s); setEditForm({ first_name: s.profile?.first_name || '', last_name: s.profile?.last_name || '', email: s.email, phone: s.profile?.phone || '', department_id: s.department_id || 1, student_number: s.student_record?.student_number || '', is_active: s.is_active }) }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit">
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => setDeleteStudent(s)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button key={page} variant="outline" size="sm" className={page === currentPage ? 'bg-primary text-primary-foreground' : ''} onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Details">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xl">
                {getName(viewStudent).charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getName(viewStudent)}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewStudent.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div><p className="text-xs font-medium text-gray-500 uppercase">Student #</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewStudent.student_record?.student_number || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Department</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewStudent.department_name || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">GPA</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewStudent.student_record?.gpa?.toFixed(2) || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Academic Status</p><p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{viewStudent.student_record?.academic_status || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Enrollment Year</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewStudent.student_record?.enrollment_year || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Phone</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewStudent.profile?.phone || 'N/A'}</p></div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewStudent(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student Number</label>
            <Input value={editForm.student_number} onChange={e => setEditForm(f => ({ ...f, student_number: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department ID</label>
              <Input type="number" value={editForm.department_id} onChange={e => setEditForm(f => ({ ...f, department_id: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Active</label>
              <select value={String(editForm.is_active)} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'true' }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditStudent(null)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleEditStudent} disabled={editing} className="w-full sm:w-auto">{editing ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <Input placeholder="First name" value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <Input placeholder="Last name" value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <Input type="email" placeholder="student@lms.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <Input type="password" placeholder="Min 8 chars" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student Number</label>
            <Input placeholder="e.g. STU-2024-001" value={addForm.student_number} onChange={e => setAddForm(f => ({ ...f, student_number: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <Input placeholder="+92-300-1234567" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleAddStudent} className="w-full sm:w-auto">Add Student</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteStudent}
        onClose={() => { setDeleteStudent(null); setDeleting(false) }}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteStudent ? getName(deleteStudent) : ''}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
