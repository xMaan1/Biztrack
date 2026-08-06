'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Search, GraduationCap, Plus, Trash2, Eye, Pencil, Loader2 } from 'lucide-react'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/lib/hooks/useDepartments'
import toast from 'react-hot-toast'

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editDept, setEditDept] = useState<{ id: number; name: string; code: string; description: string } | null>(null)
  const [deleteDept, setDeleteDept] = useState<{ id: number; name: string } | null>(null)
  const [addForm, setAddForm] = useState({ name: '', code: '', description: '' })

  const { data: departments, isLoading } = useDepartments(searchTerm || undefined)
  const createDept = useCreateDepartment()
  const updateDept = useUpdateDepartment()
  const deleteDeptMutation = useDeleteDepartment()

  const filtered = departments || []

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.code.trim()) {
      toast.error('Name and code are required')
      return
    }
    try {
      await createDept.mutateAsync({
        name: addForm.name,
        code: addForm.code,
        description: addForm.description || undefined,
      })
      toast.success('Department created')
      setShowAddModal(false)
      setAddForm({ name: '', code: '', description: '' })
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: { error?: { message?: string } } | string } } })?.response?.data
      const msg = typeof d?.detail === 'string' ? d.detail : d?.detail?.error?.message || 'Failed to create department'
      toast.error(msg)
    }
  }

  const handleEdit = async () => {
    if (!editDept) return
    if (!editDept.name.trim() || !editDept.code.trim()) {
      toast.error('Name and code are required')
      return
    }
    try {
      await updateDept.mutateAsync(editDept)
      toast.success('Department updated')
      setEditDept(null)
    } catch {
      toast.error('Failed to update department')
    }
  }

  const handleDelete = async () => {
    if (!deleteDept) return
    try {
      await deleteDeptMutation.mutateAsync(deleteDept.id)
      toast.success('Department deleted')
      setDeleteDept(null)
    } catch {
      toast.error('Failed to delete department')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} departments</p>
          </div>
        </div>
        <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Department
        </Button>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search departments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(dept => (
            <Card key={dept.id} className="hover:shadow-lg transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {dept.code || dept.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dept.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all md:opacity-100">
                    <Link
                      href={`/admin/departments/${dept.id}`}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </Link>
                    <button
                      onClick={() => setEditDept({ id: dept.id, name: dept.name, code: dept.code, description: dept.description || '' })}
                      className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-amber-500" />
                    </button>
                    <button
                      onClick={() => setDeleteDept({ id: dept.id, name: dept.name })}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                {dept.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{dept.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && !isLoading && (
            <p className="col-span-full text-center text-sm text-gray-500 py-12">No departments found.</p>
          )}
        </div>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Department">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name</label>
            <Input placeholder="e.g. Computer Science" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
            <Input placeholder="e.g. CS" value={addForm.code} onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" placeholder="Optional description..." value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleAdd} disabled={createDept.isPending} className="w-full sm:w-auto">
              {createDept.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editDept} onClose={() => setEditDept(null)} title="Edit Department">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name</label>
            <Input value={editDept?.name || ''} onChange={e => setEditDept(f => f ? { ...f, name: e.target.value } : null)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
            <Input value={editDept?.code || ''} onChange={e => setEditDept(f => f ? { ...f, code: e.target.value } : null)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={editDept?.description || ''} onChange={e => setEditDept(f => f ? { ...f, description: e.target.value } : null)} />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditDept(null)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleEdit} disabled={updateDept.isPending} className="w-full sm:w-auto">
              {updateDept.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteDept}
        onClose={() => setDeleteDept(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteDept?.name || ''}"?`}
        loading={deleteDeptMutation.isPending}
      />
    </div>
  )
}
