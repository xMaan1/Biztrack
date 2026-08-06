'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Search, Clock, FileText, Upload, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface PendingAssignment {
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
}

export default function PendingAssignmentsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-assignments', 'pending'],
    queryFn: async () => {
      const { data } = await apiClient.get(`${ENDPOINTS.assignments.list}/my?status=pending`)
      return data.data.assignments as PendingAssignment[]
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Pending Assignments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Assignments you haven&apos;t submitted yet
        </p>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search assignments..."
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
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              No pending assignments to submit
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => {
            const isOverdue = a.deadline && new Date(a.deadline) < new Date()
            const daysLeft = a.deadline
              ? Math.ceil((new Date(a.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <Card key={a.id}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-yellow-500 shrink-0" />
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                          {a.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {a.course_title && <span>{a.course_title}</span>}
                        {a.deadline && (
                          <>
                            <span>·</span>
                            <span className={isOverdue ? 'text-red-500 font-medium' : daysLeft !== null && daysLeft <= 2 ? 'text-orange-500 font-medium' : ''}>
                              {isOverdue ? 'Overdue' : `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                              {' · '}
                              {new Date(a.deadline).toLocaleDateString()}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>Max Score: {a.max_score}</span>
                      </div>
                      {a.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{a.description}</p>
                      )}
                    </div>
                    <Link href={`/student/assignments/${a.id}`} className="shrink-0">
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                        <Upload className="w-4 h-4" />
                        Submit
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
