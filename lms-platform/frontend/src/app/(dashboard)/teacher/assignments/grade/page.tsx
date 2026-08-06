'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Award, Search, Users, Loader2, CheckCircle } from 'lucide-react'
import { useCourses } from '@/lib/hooks/useCourses'
import { useAssignments, useAssignmentSubmissions, useGradeSubmission } from '@/lib/hooks/useAssignments'
import toast from 'react-hot-toast'

export default function GradeSubmissionsPage() {
  const { data: coursesData } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [search, setSearch] = useState('')
  const [gradeInputs, setGradeInputs] = useState<{ [key: number]: { score: string; feedback: string } }>({})

  const { data: assignmentsData, isLoading: assignmentsLoading } = useAssignments(
    selectedCourse ? { course_id: Number(selectedCourse), page_size: 50 } : {}
  )
  const assignments = assignmentsData?.assignments ?? []

  const { data: submissionsData, isLoading: submissionsLoading } = useAssignmentSubmissions(
    selectedAssignment ? Number(selectedAssignment) : 0
  )
  const submissions = submissionsData?.submissions ?? []
  const gradeSubmission = useGradeSubmission()

  const filtered = submissions.filter(s =>
    (s.student_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleGrade = async (submissionId: number) => {
    const input = gradeInputs[submissionId]
    if (!input || !input.score) { toast.error('Enter a score'); return }
    try {
      await gradeSubmission.mutateAsync({
        submissionId,
        score: Number(input.score),
        feedback: input.feedback || undefined,
      })
      setGradeInputs(prev => { const next = { ...prev }; delete next[submissionId]; return next })
      toast.success('Grade submitted')
    } catch {
      toast.error('Failed to grade')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Grade Submissions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and grade student submissions</p>
      </div>

      <Card>
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
              <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedAssignment('') }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">All courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignment</label>
              {assignmentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 h-10"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : (
                <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select assignment...</option>
                  {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by student name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      )}

      {submissionsLoading && (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      )}

      {!submissionsLoading && selectedAssignment && filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No submissions found</p>
          </CardContent>
        </Card>
      )}

      {!submissionsLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {(s.student_name || 'S').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">{s.student_name || 'Unknown Student'}</h3>
                        <p className="text-xs text-gray-500">Submitted {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'N/A'}</p>
                      </div>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.status}
                      </span>
                    </div>
                    {s.submission_text && (
                      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: s.submission_text }} />
                    )}
                  </div>
                  <div className="lg:w-72 shrink-0 space-y-3 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-3 lg:pt-0 lg:pl-4">
                    {s.status === 'graded' && s.grade !== null ? (
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{s.grade}</p>
                        <p className="text-xs text-gray-500">Score</p>
                        {s.feedback && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">&quot;{s.feedback}&quot;</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Score</label>
                          <Input type="number" placeholder="Enter score" value={gradeInputs[s.id]?.score || ''} onChange={e => setGradeInputs(prev => ({ ...prev, [s.id]: { score: e.target.value, feedback: prev[s.id]?.feedback || '' } }))} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Feedback</label>
                          <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[60px]" placeholder="Optional feedback..." value={gradeInputs[s.id]?.feedback || ''} onChange={e => setGradeInputs(prev => ({ ...prev, [s.id]: { score: prev[s.id]?.score || '', feedback: e.target.value } }))} />
                        </div>
                        <Button size="sm" className="w-full" onClick={() => handleGrade(s.id)} disabled={!gradeInputs[s.id]?.score || gradeSubmission.isPending}>
                          {gradeSubmission.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Award className="w-3.5 h-3.5 mr-1" />}
                          Submit Grade
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!selectedAssignment && !submissionsLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a course and assignment to view submissions</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
