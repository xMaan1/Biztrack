'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Search, CheckCircle, Award, Clock, FileText, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface SubmittedAssignment {
  id: number
  title: string
  description: string | null
  course_id: number
  course_title: string | null
  deadline: string | null
  max_score: string
  assignment_type: string
  instructions: string | null
  created_at: string | null
  my_status: string
  submission_id: number | null
  grade: number | null
  feedback: string | null
  submitted_at: string | null
}

export default function SubmittedAssignmentsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-assignments', 'submitted'],
    queryFn: async () => {
      const { data } = await apiClient.get(`${ENDPOINTS.assignments.list}/my`)
      return (data.data.assignments as SubmittedAssignment[]).filter(
        a => a.my_status === 'submitted' || a.my_status === 'graded'
      )
    },
  })

  const assignments = data ?? []
  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.course_title || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Submitted Assignments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track the status and grades of your submissions
        </p>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search submissions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No submissions yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Submit an assignment to see it here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {a.my_status === 'graded' ? (
                        <Award className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                      )}
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                        {a.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {a.course_title && <span>{a.course_title}</span>}
                      {a.submitted_at && (
                        <>
                          <span>·</span>
                          <span>Submitted {new Date(a.submitted_at).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      a.my_status === 'graded'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {a.my_status === 'graded' ? 'Graded' : 'Submitted'}
                    </span>

                    {a.my_status === 'graded' && a.grade !== null && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {a.grade}
                          <span className="text-xs font-normal text-gray-500"> / {a.max_score}</span>
                        </p>
                      </div>
                    )}

                    <Link href={`/student/assignments/${a.id}`}>
                      <button className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        View
                      </button>
                    </Link>
                  </div>
                </div>

                {a.my_status === 'graded' && a.feedback && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Feedback</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{a.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
