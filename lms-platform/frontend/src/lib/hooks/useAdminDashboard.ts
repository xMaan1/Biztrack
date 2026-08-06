import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface SystemStats {
  total_users: number
  total_students: number
  total_teachers: number
  total_courses: number
  total_enrollments: number
  active_enrollments: number
}

export interface EnrollmentStats {
  total_enrollments: number
  active: number
  completed: number
  dropped: number
  pending: number
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['admin', 'system-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.reports.systemStats)
      return data.data as SystemStats
    },
  })
}

export function useEnrollmentStats(courseId?: number) {
  return useQuery({
    queryKey: ['admin', 'enrollment-stats', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.reports.enrollmentStats, {
        params: courseId ? { course_id: courseId } : {},
      })
      return data.data as EnrollmentStats
    },
  })
}
