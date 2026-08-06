'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Award, Search, Users, Loader2, TrendingUp } from 'lucide-react'
import { useCourses } from '@/lib/hooks/useCourses'
import { useCourseGrades, useUpdateGrade } from '@/lib/hooks/useGrades'
import toast from 'react-hot-toast'

export default function GradebookPage() {
  const { data: coursesData, isLoading: loadingCourses } = useCourses({ page_size: 50 })
  const courses = coursesData?.courses ?? []
  const [selectedCourse, setSelectedCourse] = useState('')
  const [search, setSearch] = useState('')
  const [editGrades, setEditGrades] = useState<{ [key: number]: string }>({})
  const updateGrade = useUpdateGrade()

  const { data: grades, isLoading: loadingGrades } = useCourseGrades(selectedCourse ? Number(selectedCourse) : 0)
  const gradeList = grades ?? []

  const filtered = gradeList.filter(g =>
    (g.student_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const courseStats = gradeList.length > 0 ? {
    total: gradeList.length,
    graded: gradeList.filter(g => g.grade !== null && g.grade !== undefined).length,
    avgScore: gradeList.reduce((s, g) => s + (g.score || 0), 0) / gradeList.length,
    passed: gradeList.filter(g => (g.score || 0) >= 50).length,
  } : null

  const handleSaveGrade = async (gradeId: number) => {
    const score = editGrades[gradeId]
    if (!score) { toast.error('Enter a score'); return }
    try {
      await updateGrade.mutateAsync({ id: gradeId, score: Number(score) })
      setEditGrades(prev => { const next = { ...prev }; delete next[gradeId]; return next })
      toast.success('Grade updated')
    } catch { toast.error('Failed to update') }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Gradebook</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and enter student grades</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 md:p-4">
          <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Course</label>
          <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSearch('') }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Choose a course...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
          </select>
        </CardContent>
      </Card>

      {selectedCourse && courseStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-blue-500/10"><Users className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /></div>
            <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{courseStats.total}</p><p className="text-xs md:text-sm text-gray-500">Students</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-green-500/10"><Award className="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
            <div><p className="text-lg md:text-xl font-bold text-green-600">{courseStats.graded}</p><p className="text-xs md:text-sm text-gray-500">Graded</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-purple-500/10"><TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" /></div>
            <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{courseStats.avgScore.toFixed(1)}</p><p className="text-xs md:text-sm text-gray-500">Avg Score</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-orange-500/10"><TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-orange-500" /></div>
            <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{courseStats.passed}</p><p className="text-xs md:text-sm text-gray-500">Passed (&ge;50)</p></div>
          </CardContent></Card>
        </div>
      )}

      {loadingCourses ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : !selectedCourse ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a course to view and manage grades</p>
          </CardContent>
        </Card>
      ) : loadingGrades ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
              <CardTitle className="text-sm md:text-base">Student Grades</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enter Score</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{g.student_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{g.course_title || '--'}</td>
                      <td className="px-4 py-3">
                        {g.grade ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{g.grade}</span>
                        ) : <span className="text-xs text-gray-400">--</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{g.score !== null ? g.score : '--'}</td>
                      <td className="px-4 py-3">
                        <Input type="number" placeholder="Score" className="w-20 h-8 text-xs" value={editGrades[g.id] ?? ''} onChange={e => setEditGrades(prev => ({ ...prev, [g.id]: e.target.value }))} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => handleSaveGrade(g.id)} disabled={!editGrades[g.id] || updateGrade.isPending}>Save</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
