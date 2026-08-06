import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface AttendanceSessionItem {
  id: number
  course_id: number
  course_title: string | null
  title: string
  date: string
  status: string
  total_students: number
  present_count: number
  session_code: string
  session_type?: string
  session_date?: string
  session_title?: string
  created_at?: string
}

export interface AttendanceRecordItem {
  id: number
  student_id: number
  student_name: string | null
  status: string
  verification_method?: string
  marked_at?: string
}

export function useAttendanceSessions(params: { course_id?: number; page?: number; page_size?: number } = {}) {
  return useQuery({
    queryKey: ['attendance-sessions', params],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.attendance.sessions, { params })
      return (data.data?.sessions ?? data.data ?? []) as AttendanceSessionItem[]
    },
  })
}

export function useAttendanceSession(id: number) {
  return useQuery({
    queryKey: ['attendance-session', id],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.attendance.sessionDetail(id))
      return data.data as AttendanceSessionItem
    },
    enabled: !!id,
  })
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { course_id?: number; title: string }) => {
      const { data } = await apiClient.post(ENDPOINTS.attendance.createSession, payload)
      return data.data as AttendanceSessionItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] })
    },
  })
}

export function useAttendanceRecords(sessionId: number) {
  return useQuery({
    queryKey: ['attendance-records', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.attendance.records(sessionId))
      return (data.data?.records ?? data.data ?? []) as AttendanceRecordItem[]
    },
    enabled: !!sessionId,
  })
}

export function useMarkAttendance(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ studentId, status }: { studentId: number; status: string }) => {
      const { data } = await apiClient.post(ENDPOINTS.attendance.markAttendance(sessionId), {
        student_id: studentId,
        status,
        verification_method: 'manual',
      })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] })
    },
  })
}

export function useRegenerateQR() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { data } = await apiClient.post(ENDPOINTS.attendance.regenerateQR(sessionId))
      return data.data as { session_code: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] })
    },
  })
}
