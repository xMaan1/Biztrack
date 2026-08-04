'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserCheck, Calendar, Clock, AlertCircle, CheckCircle, XCircle, QrCode, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface AttendanceRecord {
  id: number
  course_id: number
  course_title: string | null
  date: string
  status: string
  time: string | null
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  percentage: number
}

export default function StudentAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(ENDPOINTS.attendance.myAttendance)
      .then(res => {
        const data = res.data.data?.records ?? res.data.data ?? []
        const recordsArr = Array.isArray(data) ? data : []
        setRecords(recordsArr)

        const present = recordsArr.filter((r: AttendanceRecord) => r.status === 'present').length
        const absent = recordsArr.filter((r: AttendanceRecord) => r.status === 'absent').length
        const late = recordsArr.filter((r: AttendanceRecord) => r.status === 'late').length
        const total = recordsArr.length
        setSummary({
          total,
          present,
          absent,
          late,
          percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
        })
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'present': return <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle className="w-4 h-4" /> Present</span>
      case 'absent': return <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle className="w-4 h-4" /> Absent</span>
      case 'late': return <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400"><Clock className="w-4 h-4" /> Late</span>
      default: return <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your attendance across all courses
          </p>
        </div>
        <Link href="/student/attendance/qr-scan" className="w-full md:w-auto">
          <Button className="flex items-center gap-2 w-full md:w-auto">
            <QrCode className="w-4 h-4" />
            Scan QR
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.total}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Calendar className="w-5 md:w-6 h-5 md:h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Present</p>
                    <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{summary.present}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 md:w-6 h-5 md:h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Absent / Late</p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{summary.absent + summary.late}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <AlertCircle className="w-5 md:w-6 h-5 md:h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Percentage</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.percentage}%</p>
                  <Progress value={summary.percentage} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Recent Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No attendance records yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {records.map((record, index) => (
                        <tr key={record.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {record.date ? new Date(record.date).toLocaleDateString() : '--'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {record.course_title || '--'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {record.time || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
