'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Award, TrendingUp, BookOpen, Loader2, ArrowUp, ArrowDown, Minus, FileText } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useAuth } from '@/lib/hooks/useAuth'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GradeRecord {
  id: number
  course_id: number
  course_title: string | null
  course_code: string | null
  grade: string | null
  grade_points: number | null
  score: number | null
  max_score: number | null
  semester: string | null
  academic_year: string | null
}

export default function StudentGrades() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    apiClient.get(ENDPOINTS.grades.student(user.id))
      .then(res => setGrades(res.data.data?.grades ?? res.data.data ?? []))
      .catch(() => setGrades([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const overallStats = grades.length > 0 ? {
    total: grades.length,
    avgScore: Math.round(grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length),
    highest: Math.max(...grades.map(g => g.score || 0)),
    lowest: Math.min(...grades.map(g => g.score || 0)),
    passed: grades.filter(g => (g.score || 0) >= 50).length,
  } : null

  const chartData = grades.map(g => ({
    name: (g.course_code || g.course_title || '').substring(0, 8),
    score: g.score || 0,
  }))

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 60) return 'bg-blue-100 text-blue-700'
    if (score >= 40) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getGradeLetter = (score: number) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">My Grades</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your academic performance across all courses</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : grades.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No grades available yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {overallStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-blue-500/10"><BookOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /></div>
                <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{overallStats.total}</p><p className="text-xs md:text-sm text-gray-500">Courses</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-purple-500/10"><TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" /></div>
                <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{overallStats.avgScore}%</p><p className="text-xs md:text-sm text-gray-500">Average</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-green-500/10"><ArrowUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                <div><p className="text-lg md:text-xl font-bold text-green-600">{overallStats.highest}</p><p className="text-xs md:text-sm text-gray-500">Highest</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-green-500/10"><Award className="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                <div><p className="text-lg md:text-xl font-bold text-green-600">{overallStats.passed}/{overallStats.total}</p><p className="text-xs md:text-sm text-gray-500">Passed</p></div>
              </CardContent></Card>
            </div>
          )}

          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <BarChart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Grade Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Course-wise Grades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {grades.map(g => (
                      <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{g.course_title || 'Unknown'}</p>
                          {g.course_code && <p className="text-xs text-gray-500">{g.course_code}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{g.semester || '--'} {g.academic_year || ''}</td>
                        <td className="px-4 py-3">
                          <span className={`text-lg font-bold ${getGradeColor(g.score || 0)}`}>{g.score ?? '--'}</span>
                          {g.max_score && <span className="text-xs text-gray-400">/{g.max_score}</span>}
                        </td>
                        <td className="px-4 py-3">
                          {g.score !== null ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getGradeBadge(g.score)}`}>
                              {getGradeLetter(g.score)} ({g.grade || '--'})
                            </span>
                          ) : <span className="text-xs text-gray-400">--</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(g.score || 0) >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {(g.score || 0) >= 50 ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
