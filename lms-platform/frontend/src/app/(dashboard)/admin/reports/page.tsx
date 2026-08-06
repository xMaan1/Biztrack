'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { BarChart3, Users, BookOpen, Award } from 'lucide-react'
import Link from 'next/link'

const reports = [
  {
    title: 'Enrollment Report',
    description: 'View student enrollment statistics across courses and departments.',
    icon: <Users className="w-6 h-6" />,
    href: '/admin/reports/enrollment',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Attendance Report',
    description: 'Track attendance patterns and generate attendance summaries.',
    icon: <BookOpen className="w-6 h-6" />,
    href: '/admin/reports/attendance',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    title: 'Grade Report',
    description: 'Analyze grade distributions and academic performance.',
    icon: <Award className="w-6 h-6" />,
    href: '/admin/reports/grades',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">System-wide analytics and reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <Link key={report.href} href={report.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center mb-4`}>
                  {report.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{report.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{report.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
