'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCourse } from '@/lib/hooks/useCourses'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { Search, Plus, ArrowLeft, FileText, Clock, Users, Trash2, Eye, Loader2 } from 'lucide-react'

export default function CourseAssignments() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params.courseId)
  const { data: course } = useCourse(courseId)
  const [search, setSearch] = useState('')
  const { data: assignmentsData, isLoading } = useAssignments(courseId ? { course_id: courseId, page_size: 50 } : {})
  const assignments = assignmentsData?.assignments ?? []

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/courses/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{course?.title || 'Course'} &mdash; Manage assignments</p>
          </div>
        </div>
        <Link href="/teacher/assignments/create">
          <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" /> Create Assignment</Button>
        </Link>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No assignments yet</p>
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
                      {a.deadline && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {new Date(a.deadline).toLocaleDateString()}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {a.submissions_count ?? 0} submissions</span>
                      <span>Max: {a.max_score}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/teacher/assignments/${a.id}/submissions`}>
                      <Button variant="outline" size="sm"><Eye className="w-3.5 h-3.5 mr-1" /> Submissions</Button>
                    </Link>
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
