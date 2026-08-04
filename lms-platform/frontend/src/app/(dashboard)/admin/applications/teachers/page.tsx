'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTeacherApplications } from '@/lib/hooks/useApplications'
import { Search, Clock, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { TeacherApplication } from '@/lib/types/application.types'

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  submitted: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3.5 h-3.5" /> },
  reviewed: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  selected: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3.5 h-3.5" /> },
}

export default function AdminTeacherApplicationsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useTeacherApplications({ page, page_size: 10, status_filter: statusFilter || undefined, search: search || undefined })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Applications</h1>
        <p className="text-gray-500 mt-1">Review and manage teacher applications</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : !data?.applications?.length ? (
          <div className="py-12 text-center text-gray-500">No applications found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.applications.map((app: TeacherApplication) => {
                  const a = app
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{a.full_name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{a.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{a.highest_qualification || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[a.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusConfig[a.status]?.icon}
                          <span className="capitalize">{a.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/applications/teachers/${a.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                          <Eye className="w-4 h-4" /> View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
