'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Search, Filter, UserPlus, Trash2, Eye, Pencil, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useDepartments, useCreateDepartment } from '@/lib/hooks/useDepartments'
import type { User, UsersResponse, CreateUserRequest } from '@/lib/types/user.types'

const ITEMS_PER_PAGE = 10

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

const ROLES = [
  { label: 'All Roles', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Student', value: 'student' },
]

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [viewUser, setViewUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [addForm, setAddForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    role: 'student', phone: '', department_id: 0,
  })

  const [editForm, setEditForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    role: '3', department_id: 0, is_active: true,
  })

  const { data: departments = [] } = useDepartments()
  const createDeptMutation = useCreateDepartment()
  const [showNewDept, setShowNewDept] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptCode, setNewDeptCode] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        skip: String((currentPage - 1) * ITEMS_PER_PAGE),
        limit: String(ITEMS_PER_PAGE),
      })
      if (searchTerm) params.set('search', searchTerm)
      if (filterRole !== 'all') params.set('role', filterRole)

      const res = await apiClient.get(`${ENDPOINTS.users.list}?${params}`)
      const data: UsersResponse = res.data.data
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load users:', err)
      toast.error(extractError(err, 'Failed to load users. Is the backend running?'))
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, filterRole])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleAddUser = async () => {
    if (!addForm.first_name.trim() || !addForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    try {
      const payload: CreateUserRequest = {
        email: addForm.email,
        password: addForm.password || 'Password@123',
        role: addForm.role,
        department_id: addForm.department_id || undefined,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        phone: addForm.phone,
      }
      await apiClient.post(ENDPOINTS.users.create, payload)
      toast.success('User added successfully')
      setShowAddModal(false)
      setAddForm({ first_name: '', last_name: '', email: '', password: '', role: 'student', phone: '', department_id: 0 })
      fetchUsers()
    } catch (err: unknown) {
      toast.error(extractError(err, 'Failed to add user'))
    }
  }

  const handleEditUser = async () => {
    if (!editUser) return
    setEditing(true)
    try {
      await apiClient.put(ENDPOINTS.users.update(editUser.id), {
        email: editForm.email,
        role: editForm.role,
        department_id: editForm.department_id || null,
        is_active: editForm.is_active,
        profile: {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
        },
      })
      toast.success('User updated')
      setEditUser(null)
      fetchUsers()
    } catch {
      toast.error('Failed to update user')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUser) return
    setDeleting(true)
    try {
      await apiClient.delete(ENDPOINTS.users.delete(deleteUser.id))
      toast.success('User deleted')
      setDeleteUser(null)
      fetchUsers()
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim() || !newDeptCode.trim()) {
      toast.error('Department name and code are required')
      return
    }
    try {
      const dept = await createDeptMutation.mutateAsync({ name: newDeptName.trim(), code: newDeptCode.trim() })
      toast.success('Department created')
      setAddForm(f => ({ ...f, department_id: dept.id }))
      setEditForm(f => ({ ...f, department_id: dept.id }))
      setNewDeptName('')
      setNewDeptCode('')
      setShowNewDept(false)
    } catch (err) {
      toast.error(extractError(err, 'Failed to create department'))
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const getName = (u: User) => u.profile ? `${u.profile.first_name} ${u.profile.last_name}` : u.email

  const getRoleColor = (role: string | null | undefined) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    }
    return colors[role || ''] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">All Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} users in the system</p>
        </div>
        <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} className="pl-9" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1) }} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterRole('all'); setCurrentPage(1) }} className="flex items-center gap-2">
                <Filter className="w-4 h-4" /> Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">No users found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {getName(user).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{getName(user)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.department_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>{user.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewUser(user)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => { setEditUser(user); setEditForm({ first_name: user.profile?.first_name || '', last_name: user.profile?.last_name || '', email: user.email, phone: user.profile?.phone || '', role: user.role, department_id: user.department_id || 0, is_active: user.is_active }) }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => setDeleteUser(user)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
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
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
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

      {/* View Modal */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {getName(viewUser).charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getName(viewUser)}</h3>
                <p className="text-sm text-gray-500">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div><p className="text-xs font-medium text-gray-500 uppercase">Role</p><p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{viewUser.role}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Status</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewUser.is_active ? 'Active' : 'Inactive'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Department</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewUser.department_name || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Phone</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewUser.profile?.phone || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">User ID</p><p className="mt-1 text-sm text-gray-900 dark:text-white">#{viewUser.id}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Created</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(viewUser.created_at).toLocaleDateString()}</p></div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewUser(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setShowNewDept(false) }} title="Add New User">
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
            <Input type="email" placeholder="user@lms.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <Input type="password" placeholder="Min 8 chars" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <Input placeholder="+92-300-1234567" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            {!showNewDept ? (
              <div className="flex gap-2">
                <select value={addForm.department_id} onChange={e => setAddForm(f => ({ ...f, department_id: Number(e.target.value) }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value={0}>Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewDept(true)} className="shrink-0 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> New
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Department name" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                  <Input placeholder="Code (e.g. CS)" value={newDeptCode} onChange={e => setNewDeptCode(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleCreateDepartment} disabled={createDeptMutation.isPending}>
                    {createDeptMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setShowNewDept(false); setNewDeptName(''); setNewDeptCode('') }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleAddUser} className="w-full sm:w-auto">Add User</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => { setEditUser(null); setShowNewDept(false) }} title="Edit User">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              {!showNewDept ? (
                <div className="flex gap-2">
                  <select value={editForm.department_id} onChange={e => setEditForm(f => ({ ...f, department_id: Number(e.target.value) }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value={0}>Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNewDept(true)} className="shrink-0 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> New
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Department name" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                    <Input placeholder="Code (e.g. CS)" value={newDeptCode} onChange={e => setNewDeptCode(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleCreateDepartment} disabled={createDeptMutation.isPending}>
                      {createDeptMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => { setShowNewDept(false); setNewDeptName(''); setNewDeptCode('') }}>Cancel</Button>
                  </div>
                </div>
              )}
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
            <Button variant="outline" onClick={() => setEditUser(null)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleEditUser} disabled={editing} className="w-full sm:w-auto">{editing ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <ConfirmModal
        open={!!deleteUser}
        onClose={() => { setDeleteUser(null); setDeleting(false) }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteUser ? getName(deleteUser) : ''}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
