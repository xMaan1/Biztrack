'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, GraduationCap, Loader2, Pencil, Save, X } from 'lucide-react'
import { useDepartment, useUpdateDepartment } from '@/lib/hooks/useDepartments'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function DepartmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deptId = Number(params?.id)

  const { data: dept, isLoading, isError } = useDepartment(deptId)
  const updateDept = useUpdateDepartment()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const startEditing = () => {
    if (!dept) return
    setForm({ name: dept.name, code: dept.code, description: dept.description || '' })
    setEditing(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required')
      return
    }
    try {
      await updateDept.mutateAsync({ id: deptId, ...form })
      toast.success('Department updated')
      setEditing(false)
    } catch {
      toast.error('Failed to update department')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !dept) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-500 dark:text-gray-400">Department not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/departments')}>Back to Departments</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/departments')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{dept.name}</h1>
        </div>
        {!editing && (
          <Button onClick={startEditing} className="w-full sm:w-auto">
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)} className="w-full sm:w-auto">
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateDept.isPending} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-1" /> {updateDept.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Code</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{dept.code}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Head Teacher</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{dept.head_teacher_name || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{dept.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(dept.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Last Updated</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(dept.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
