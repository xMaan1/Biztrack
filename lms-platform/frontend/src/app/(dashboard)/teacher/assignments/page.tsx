'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Plus, FileText, Clock, Users, Eye, Trash2, Loader2, GraduationCap } from 'lucide-react'
import { useAssignments, useDeleteAssignment } from '@/lib/hooks/useAssignments'
import toast from 'react-hot-toast'

export default function TeacherAssignments() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useAssignments({ page_size: 50 })
  const deleteAssignment = useDeleteAssignment()
  const assignments = data?.assignments ?? []

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.course_title || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this assignment?')) return
    try {
      await deleteAssignment.mutateAsync(id)
      toast.success('Assignment deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage assignments across all courses</p>
        </div>
        <Link href="/teacher/assignments/create" className="w-full md:w-auto">
          <Button className="w-full md:w-auto"><Plus className="w-4 h-4 mr-1" /> Create Assignment</Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Link href="/teacher/assignments/create">
          <Button variant="outline" className="w-full md:w-auto"><Plus className="w-4 h-4 mr-1" /> New</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No assignments found</p>
            <Link href="/teacher/assignments/create"><Button variant="outline" className="mt-3">Create First Assignment</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(a => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">{a.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs md:text-sm text-gray-500">
                      {a.course_title && <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{a.course_title}</span>}
                      {a.deadline && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Due: {new Date(a.deadline).toLocaleDateString()}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{a.submissions_count ?? 0} submissions</span>
                      <span>Max: {a.max_score}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/teacher/assignments/${a.id}/submissions`}>
                      <Button variant="outline" size="sm"><Eye className="w-3.5 h-3.5 mr-1" /> Submissions</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-red-500" disabled={deleteAssignment.isPending}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
