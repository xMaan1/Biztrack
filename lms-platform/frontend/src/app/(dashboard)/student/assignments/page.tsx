'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Search, ClipboardList, Clock, CheckCircle, AlertCircle, FileText, Upload, Award, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface AssignmentItem {
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

export default function StudentAssignments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: async () => {
      const { data } = await apiClient.get(`${ENDPOINTS.assignments.list}/my`)
      return data.data.assignments as AssignmentItem[]
    },
  })

  const assignments = data ?? []

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.course_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || a.my_status === filter
    return matchesSearch && matchesFilter
  })

  const statusIcon = (s: string) => {
    switch (s) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'submitted': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'graded': return <Award className="w-4 h-4 text-green-500" />
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'graded': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and submit your assignments
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm w-full md:w-auto"
        >
          <option value="all">All Assignments</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Assignments Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filter === 'all' ? 'You have no assignments yet' : `No ${filter} assignments`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const isOverdue = a.my_status === 'overdue'
            const daysLeft = a.deadline
              ? Math.ceil((new Date(a.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <Card key={a.id}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {a.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {a.course_title && <span>{a.course_title}</span>}
                        {a.deadline && (
                          <>
                            <span>·</span>
                            <span className={isOverdue ? 'text-red-500 font-medium' : daysLeft !== null && daysLeft <= 2 ? 'text-orange-500 font-medium' : ''}>
                              Due: {new Date(a.deadline).toLocaleDateString()}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>Max Score: {a.max_score}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <div className="flex items-center gap-2">
                        {statusIcon(a.my_status)}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(a.my_status)}`}>
                          {a.my_status.charAt(0).toUpperCase() + a.my_status.slice(1)}
                        </span>
                      </div>

                      {a.my_status === 'graded' && a.grade !== null && (
                        <div className="text-center">
                          <span className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                            {a.grade}
                          </span>
                          <span className="text-xs text-gray-500"> / {a.max_score}</span>
                        </div>
                      )}

                      <Link href={`/student/assignments/${a.id}`}>
                        {(a.my_status === 'pending' || a.my_status === 'overdue') ? (
                          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                            <Upload className="w-4 h-4" />
                            Submit
                          </button>
                        ) : (
                          <button className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            View
                          </button>
                        )}
                      </Link>
                    </div>
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
