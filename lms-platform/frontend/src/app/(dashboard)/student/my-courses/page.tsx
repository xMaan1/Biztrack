'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/Button'
import { BookOpen, Search, Clock, Video, ArrowRight, Loader2, User } from 'lucide-react'
import { useMyEnrollments } from '@/lib/hooks/useEnrollments'

export default function MyCourses() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: enrollments, isLoading } = useMyEnrollments('active')

  const filtered = (enrollments || []).filter(e =>
    (e.course_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.course_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your progress across all enrolled courses
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">{enrollment.course_title}</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.course_code}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round(enrollment.completion_percentage)}%
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                    </div>
                    <Progress value={Math.round(enrollment.completion_percentage)} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{enrollment.student_name || 'Enrolled'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Status: {enrollment.status}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/student/my-courses/${enrollment.course_id}/lectures`} className="flex-1">
                      <Button variant="default" className="w-full">
                        Continue Learning
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
          </Link>

                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Courses Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You are not enrolled in any courses yet
          </p>
          <Link href="/student/courses">
            <Button className="mt-4">Browse Courses</Button>
          </Link>
          
        </div>
      )}
    </div>
  )
}
