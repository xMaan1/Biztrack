'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Award, Loader2 } from 'lucide-react'
import Link from 'next/link'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useCourses } from '@/lib/hooks/useCourses'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface GradeDistribution {
  course_id: number
  distribution: Record<string, number>
  total_grades: number
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#EF4444']

export default function GradesReportPage() {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [data, setData] = useState<GradeDistribution | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: coursesData } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []

  const fetchData = useCallback(async () => {
    if (!selectedCourse) return
    setLoading(true)
    try {
      const res = await apiClient.get(ENDPOINTS.reports.gradeDistribution(Number(selectedCourse)))
      setData(res.data.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedCourse])

  useEffect(() => { fetchData() }, [fetchData])

  const chartData = data?.distribution
    ? Object.entries(data.distribution).map(([grade, count]) => ({ grade, count }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grade Report</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Analyze grade distributions by course</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose a course...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && !selectedCourse && (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a course to view grade distribution.</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedCourse && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{data.total_grades}</p>
                <p className="text-sm text-gray-500 mt-1">Graded Students</p>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="grade" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                      <Bar dataKey="count" name="Students">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && selectedCourse && !data && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No grade data available for this course.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
