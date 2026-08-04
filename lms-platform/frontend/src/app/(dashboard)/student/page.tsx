'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookOpen, Clock, CheckCircle, Award, TrendingUp, Calendar, Video, FileText } from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function StudentDashboard() {
  const { user } = useAuth()

  // Mock data
  const stats = [
    { title: 'Enrolled Courses', value: '5', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Hours Watched', value: '24', icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Assignments Done', value: '12/18', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Average Grade', value: '82%', icon: Award, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ]

  const courseProgress = [
    { name: 'CS-101: Programming', progress: 75, color: '#3B82F6' },
    { name: 'CS-201: Data Structures', progress: 45, color: '#8B5CF6' },
    { name: 'MATH-101: Calculus', progress: 90, color: '#10B981' },
    { name: 'PHY-101: Mechanics', progress: 60, color: '#F59E0B' },
    { name: 'ENG-101: English', progress: 30, color: '#EF4444' },
  ]

  const attendanceData = [
    { month: 'Sep', present: 12, absent: 3 },
    { month: 'Oct', present: 15, absent: 2 },
    { month: 'Nov', present: 14, absent: 4 },
    { month: 'Dec', present: 10, absent: 1 },
  ]

  const upcomingDeadlines = [
    { title: 'Assignment 2 - CS-101', due: 'Tomorrow, 11:59 PM', course: 'Programming' },
    { title: 'Lab Report - PHY-101', due: 'Dec 22, 11:59 PM', course: 'Mechanics' },
    { title: 'Quiz 3 - MATH-101', due: 'Dec 25, 9:00 AM', course: 'Calculus' },
    { title: 'Project Proposal - CS-201', due: 'Dec 28, 11:59 PM', course: 'Data Structures' },
  ]

  const recentActivities = [
    { title: 'Completed Lecture 5: Python Functions', course: 'CS-101', time: '2 hours ago' },
    { title: 'Submitted Assignment 1', course: 'MATH-101', time: '4 hours ago' },
    { title: 'Watched Lecture 3: Arrays', course: 'CS-201', time: '1 day ago' },
    { title: 'Attendance marked for PHY-101', course: 'PHY-101', time: '2 days ago' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.full_name || 'Student'}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s your learning progress overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
            Active Student
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseProgress.map((course, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {course.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.progress}%
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="present" fill="#3B82F6" name="Present" />
                  <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Present: 51</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Absent: 10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Average: 83.6%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {deadline.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {deadline.course}
                      </span>
                      <span className="text-xs text-red-500 dark:text-red-400">
                        Due: {deadline.due}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/student/assignments`}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.course} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/student/my-courses"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <BookOpen className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">My Courses</span>
            </Link>
            <Link
              href="/student/attendance/qr-scan"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Calendar className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scan QR</span>
            </Link>
            <Link
              href="/student/assignments"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <FileText className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignments</span>
            </Link>
            <Link
              href="/student/grades"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Award className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">My Grades</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}