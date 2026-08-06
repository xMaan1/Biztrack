'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookOpen, Users, ClipboardList, UserCheck, TrendingUp, Clock, Calendar, Award, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useCourses } from '@/lib/hooks/useCourses'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { useAttendanceSessions } from '@/lib/hooks/useAttendance'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useState, useEffect } from 'react'

interface EnrollmentStats {
  total_enrollments: number
  active: number
  completed: number
  dropped: number
  pending: number
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data: coursesData, isLoading: coursesLoading } = useCourses({ page_size: 100 })
  const { data: assignmentsData, isLoading: assignmentsLoading } = useAssignments({ page_size: 50 })
  const { data: sessions, isLoading: sessionsLoading } = useAttendanceSessions({ page_size: 50 })
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats | null>(null)

  const courses = coursesData?.courses ?? []
  const assignments = assignmentsData?.assignments ?? []
  const attendanceSessions = Array.isArray(sessions) ? sessions : []

  useEffect(() => {
    apiClient.get(ENDPOINTS.reports.enrollmentStats)
      .then(res => setEnrollmentStats(res.data.data as EnrollmentStats))
      .catch(() => {})
  }, [])

  const isLoading = coursesLoading || assignmentsLoading || sessionsLoading

  const totalStudents = enrollmentStats?.active ?? courses.reduce((sum, c) => sum + (c.current_enrollment || 0), 0)
  const pendingAssignments = assignments.filter(a => {
    if (!a.deadline) return false
    return new Date(a.deadline) > new Date()
  }).length

  const totalSessions = attendanceSessions.length
  const avgAttendance = totalSessions > 0
    ? Math.round(attendanceSessions.reduce((sum, s) => sum + (s.total_students > 0 ? (s.present_count / s.total_students) * 100 : 0), 0) / totalSessions)
    : 0

  const attendanceData = attendanceSessions.slice(0, 7).map(s => ({
    day: s.title?.substring(0, 10) || 'Session',
    present: s.present_count || 0,
    absent: (s.total_students || 0) - (s.present_count || 0),
  }))

  const coursePerformanceData = courses.slice(0, 6).map(c => ({
    name: c.code,
    enrollment: c.current_enrollment || 0,
    capacity: c.max_students || 0,
  }))

  const upcomingAssignments = assignments
    .filter(a => a.deadline && new Date(a.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4)
    .map(a => ({
      title: a.title,
      due: new Date(a.deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      course: a.course_title || 'Unknown Course',
      priority: a.deadline && new Date(a.deadline).getTime() - Date.now() < 86400000 ? 'High' : 'Medium',
    }))

  const stats = [
    { title: 'My Courses', value: String(courses.length), icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Total Students', value: String(totalStudents), icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Active Assignments', value: String(pendingAssignments), icon: ClipboardList, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Avg Attendance', value: `${avgAttendance}%`, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.full_name || 'Teacher'}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s your teaching overview for today
          </p>
        </div>
        <Link
          href="/teacher/courses/create"
          className="w-full md:w-auto text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          + New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64">
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="present" fill="#3B82F6" name="Present" />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">No attendance data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Course Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64">
              {coursePerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={coursePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="enrollment" stroke="#8B5CF6" strokeWidth={2} name="Enrolled" />
                    <Line type="monotone" dataKey="capacity" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" name="Capacity" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">No course data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {upcomingAssignments.length > 0 ? upcomingAssignments.map((task, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.course} - Due: {task.due}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming assignments</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {courses.length > 0 ? courses.slice(0, 4).map((course) => (
                <Link key={course.id} href={`/teacher/courses/${course.id}`} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-2 -mx-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {course.code} - {course.current_enrollment} students
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    course.is_published
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                </Link>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No courses yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <Link
              href="/teacher/attendance/qr"
              className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
              <span className="text-xs md:text-sm font-medium text-center text-gray-700 dark:text-gray-300">Mark Attendance</span>
            </Link>
            <Link
              href="/teacher/assignments/create"
              className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
              <span className="text-xs md:text-sm font-medium text-center text-gray-700 dark:text-gray-300">Create Assignment</span>
            </Link>
            <Link
              href="/teacher/courses/create"
              className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
              <span className="text-xs md:text-sm font-medium text-center text-gray-700 dark:text-gray-300">Add Course</span>
            </Link>
            <Link
              href="/teacher/gradebook"
              className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Award className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
              <span className="text-xs md:text-sm font-medium text-center text-gray-700 dark:text-gray-300">View Gradebook</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
