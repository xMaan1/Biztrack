'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Search, Filter, UserPlus, Trash2, Eye, Pencil, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { AdminUser, UsersResponse, CreateUserRequest } from '@/lib/types/user.types'

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

export default function AdminsManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [viewAdmin, setViewAdmin] = useState<AdminUser | null>(null)
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null)
  const [deleteAdmin, setDeleteAdmin] = useState<AdminUser | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [addForm, setAddForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    department_id: 1, employee_number: '', phone: '',
  })

  const [editForm, setEditForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    department_id: 1, employee_number: '', is_active: true,
  })

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        skip: String((currentPage - 1) * ITEMS_PER_PAGE),
        limit: String(ITEMS_PER_PAGE),
      })
      if (searchTerm) params.set('search', searchTerm)

      const res = await apiClient.get(`${ENDPOINTS.users.admins}?${params}`)
      const data: UsersResponse = res.data.data
      setAdmins(data.users as AdminUser[])
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load admins:', err)
      toast.error('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  const handleAddAdmin = async () => {
    if (!addForm.first_name.trim() || !addForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    try {
      const payload: CreateUserRequest = {
        email: addForm.email,
        password: addForm.password || 'Admin@123',
        role: 'admin',
        department_id: addForm.department_id,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        phone: addForm.phone,
        employee_number: addForm.employee_number,
      }
      await apiClient.post(ENDPOINTS.users.create, payload)
      toast.success('Admin added successfully')
      setShowAddModal(false)
      setAddForm({ first_name: '', last_name: '', email: '', password: '', department_id: 1, employee_number: '', phone: '' })
      fetchAdmins()
    } catch (err: unknown) {
      toast.error(extractError(err, 'Failed to add admin'))
    }
  }

  const handleEditAdmin = async () => {
    if (!editAdmin) return
    setEditing(true)
    try {
      await apiClient.put(ENDPOINTS.users.update(editAdmin.id), {
        email: editForm.email,
        department_id: editForm.department_id,
        is_active: editForm.is_active,
        profile: {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
        },
      })
      toast.success('Admin updated')
      setEditAdmin(null)
      fetchAdmins()
    } catch {
      toast.error('Failed to update admin')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!deleteAdmin) return
    setDeleting(true)
    try {
      await apiClient.delete(ENDPOINTS.users.delete(deleteAdmin.id))
      toast.success('Admin deleted')
      setDeleteAdmin(null)
      fetchAdmins()
    } catch {
      toast.error('Failed to delete admin')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const getName = (a: AdminUser) => a.profile ? `${a.profile.first_name} ${a.profile.last_name}` : a.email

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administrators</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} admins</p>
          </div>
        </div>
        <Button className="w-full sm:w-auto flex items-center gap-2 justify-center" onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" />
          Add Admin
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search admins..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} className="pl-9" />
            </div>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setCurrentPage(1) }} className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">No admins found.</td></tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-semibold text-sm">
                          {getName(a).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{getName(a)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.admin_record?.employee_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{a.admin_record?.admin_level?.replace('_', ' ') || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>{a.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewAdmin(a)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => { setEditAdmin(a); setEditForm({ first_name: a.profile?.first_name || '', last_name: a.profile?.last_name || '', email: a.email, phone: a.profile?.phone || '', department_id: a.department_id || 1, employee_number: a.admin_record?.employee_number || '', is_active: a.is_active }) }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit">
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => setDeleteAdmin(a)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
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
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total}
          </p>
          <div className="flex gap-2">
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

      <Modal open={!!viewAdmin} onClose={() => setViewAdmin(null)} title="Admin Details">
        {viewAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold text-xl">
                {getName(viewAdmin).charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getName(viewAdmin)}</h3>
                <p className="text-sm text-gray-500">{viewAdmin.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div><p className="text-xs font-medium text-gray-500 uppercase">Employee #</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewAdmin.admin_record?.employee_number || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Admin Level</p><p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{viewAdmin.admin_record?.admin_level?.replace('_', ' ') || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Phone</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewAdmin.profile?.phone || 'N/A'}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase">Department</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{viewAdmin.department_name || 'N/A'}</p></div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewAdmin(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editAdmin} onClose={() => setEditAdmin(null)} title="Edit Admin">
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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditAdmin(null)}>Cancel</Button>
            <Button onClick={handleEditAdmin} disabled={editing}>{editing ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Admin">
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
            <Input type="email" placeholder="admin@lms.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <Input type="password" placeholder="Min 8 chars" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Number</label>
            <Input placeholder="e.g. ADM-2024-001" value={addForm.employee_number} onChange={e => setAddForm(f => ({ ...f, employee_number: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <Input placeholder="+92-300-1234567" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddAdmin}>Add Admin</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteAdmin}
        onClose={() => { setDeleteAdmin(null); setDeleting(false) }}
        onConfirm={handleDeleteAdmin}
        title="Delete Admin"
        message={`Are you sure you want to delete "${deleteAdmin ? getName(deleteAdmin) : ''}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
