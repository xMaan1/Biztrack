'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserCheck, Calendar, QrCode, CheckCircle, Loader2 } from 'lucide-react'
import { useAttendanceSessions } from '@/lib/hooks/useAttendance'

export default function TeacherAttendance() {
  const { data: sessions, isLoading } = useAttendanceSessions({ page_size: 50 })
  const sessionList = Array.isArray(sessions) ? sessions : []

  const stats = sessionList.length > 0 ? {
    total: sessionList.length,
    active: sessionList.filter(s => s.status === 'active').length,
    totalPresent: sessionList.reduce((sum, s) => sum + (s.present_count || 0), 0),
    avgPercentage: (() => {
      const totalStudents = sessionList.reduce((sum, s) => sum + (s.total_students || 0), 0)
      const totalPresent = sessionList.reduce((sum, s) => sum + (s.present_count || 0), 0)
      return totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0
    })(),
  } : { total: 0, active: 0, totalPresent: 0, avgPercentage: 0 }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage student attendance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/teacher/attendance/qr"><Button variant="outline" className="w-full sm:w-auto"><QrCode className="w-4 h-4 mr-1" /> QR Generator</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-blue-500/10"><Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /></div>
          <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p><p className="text-xs md:text-sm text-gray-500">Total Sessions</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-green-500/10"><CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
          <div><p className="text-lg md:text-xl font-bold text-green-600">{stats.active}</p><p className="text-xs md:text-sm text-gray-500">Active</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-purple-500/10"><UserCheck className="w-4 h-4 md:w-5 md:h-5 text-purple-500" /></div>
          <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stats.totalPresent}</p><p className="text-xs md:text-sm text-gray-500">Marked Present</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-orange-500/10"><UserCheck className="w-4 h-4 md:w-5 md:h-5 text-orange-500" /></div>
          <div><p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stats.avgPercentage}%</p><p className="text-xs md:text-sm text-gray-500">Avg Attendance</p></div>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : sessionList.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No attendance sessions yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sessionList.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{s.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{s.course_title || '--'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{s.date ? new Date(s.date).toLocaleDateString() : '--'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{s.present_count}/{s.total_students}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/teacher/attendance/qr?sessionId=${s.id}`}>
                          <Button variant="ghost" size="sm"><QrCode className="w-3.5 h-3.5" /></Button>
                        </Link>
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
