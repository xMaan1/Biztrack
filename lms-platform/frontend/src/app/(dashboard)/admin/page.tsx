'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, BookOpen, GraduationCap, UserCheck, TrendingUp, Award, Clock, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useSystemStats, useEnrollmentStats } from '@/lib/hooks/useAdminDashboard'
import { useCourses } from '@/lib/hooks/useCourses'

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']

export default function AdminDashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useSystemStats()
  const { data: enrollStats } = useEnrollmentStats()
  const { data: coursesData } = useCourses({ page_size: 100 })

  const statsCards = [
    { title: 'Total Users', value: stats?.total_users ?? '—', icon: Users, trend: '', color: 'text-blue-500' },
    { title: 'Total Courses', value: stats?.total_courses ?? '—', icon: BookOpen, trend: '', color: 'text-purple-500' },
    { title: 'Total Students', value: stats?.total_students ?? '—', icon: GraduationCap, trend: '', color: 'text-green-500' },
    { title: 'Active Students', value: stats?.active_enrollments ?? '—', icon: UserCheck, trend: '', color: 'text-orange-500' },
  ]

  const enrollmentData = [
    { month: 'Active', students: enrollStats?.active ?? 0, courses: stats?.total_courses ?? 0 },
    { month: 'Completed', students: enrollStats?.completed ?? 0, courses: 0 },
    { month: 'Dropped', students: enrollStats?.dropped ?? 0, courses: 0 },
    { month: 'Pending', students: enrollStats?.pending ?? 0, courses: 0 },
  ]

  const courses = coursesData?.courses ?? []
  const deptCounts: Record<string, number> = {}
  courses.forEach(c => {
    const name = c.department_name || 'Unknown'
    deptCounts[name] = (deptCounts[name] || 0) + 1
  })
  const courseDistribution = Object.entries(deptCounts).map(([name, value]) => ({ name, value }))
  const pieData = courseDistribution.length > 0 ? courseDistribution : [{ name: 'No Data', value: 1 }]

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.full_name || 'Admin'}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s what&apos;s happening with your institution today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}/10`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Enrollment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="students" fill="#3B82F6" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Course Distribution by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.total_users ?? 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.total_teachers ?? 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Teachers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.total_enrollments ?? 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enrollments</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.total_courses ?? 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Courses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
