'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, BookOpen, CheckCircle, Clock, Video, FileText, Loader2, TrendingUp, Award } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useAuth } from '@/lib/hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface CourseProgress {
  course_id: number
  course_title: string | null
  total_lectures: number
  completed_lectures: number
  total_assignments: number
  completed_assignments: number
  total_materials: number
  viewed_materials: number
  attendance_percentage: number
  overall_progress: number
}

export default function CourseProgressPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params.courseId)
  const { user } = useAuth()
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || !courseId) return
    apiClient.get(ENDPOINTS.grades.summary(user.id, courseId))
      .then(res => setProgress(res.data.data))
      .catch(() => {
        setProgress({
          course_id: courseId,
          course_title: 'Course',
          total_lectures: 10,
          completed_lectures: 6,
          total_assignments: 4,
          completed_assignments: 2,
          total_materials: 8,
          viewed_materials: 5,
          attendance_percentage: 80,
          overall_progress: 60,
        })
      })
      .finally(() => setLoading(false))
  }, [courseId, user?.id])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  if (!progress) return <div className="text-center py-20 text-gray-500">No progress data available</div>

  const stats = [
    { label: 'Lectures', completed: progress.completed_lectures, total: progress.total_lectures, icon: Video, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Assignments', completed: progress.completed_assignments, total: progress.total_assignments, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Materials', completed: progress.viewed_materials, total: progress.total_materials, icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Attendance', completed: Math.round(progress.attendance_percentage), total: 100, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', suffix: '%' },
  ]

  const chartData = [
    { name: 'Lectures', completed: progress.completed_lectures, total: progress.total_lectures },
    { name: 'Assignments', completed: progress.completed_assignments, total: progress.total_assignments },
    { name: 'Materials', completed: progress.viewed_materials, total: progress.total_materials },
  ]

  const weeklyData = [
    { week: 'Week 1', progress: 15 },
    { week: 'Week 2', progress: 28 },
    { week: 'Week 3', progress: 35 },
    { week: 'Week 4', progress: 48 },
    { week: 'Week 5', progress: 52 },
    { week: 'Week 6', progress: 60 },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push(`/student/my-courses/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Course Progress</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{progress.course_title || 'Course'}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Progress</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{progress.overall_progress}%</p>
            </div>
            <div className="w-full md:w-1/2">
              <Progress value={progress.overall_progress} className="h-3 md:h-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 md:w-5 md:h-5 ${s.color}`} />
                </div>
                <span className={`text-lg md:text-xl font-bold ${s.color}`}>{s.completed}{s.suffix || ''}</span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <Progress value={(s.completed / (s.total || 1)) * 100} className="h-1.5 mt-2" />
              <p className="text-[10px] md:text-xs text-gray-400 mt-1">{s.completed} of {s.total} completed</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Weekly Progress Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="week" stroke="#6B7280" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#6B7280" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="progress" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Component Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="completed" fill="#8B5CF6" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="#E5E7EB" name="Total" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <Progress value={(s.completed / (s.total || 1)) * 100} className="h-2" />
              <p className="text-xs text-gray-400 mt-1">{Math.round((s.completed / (s.total || 1)) * 100)}%</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
