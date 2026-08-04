import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface Enrollment {
  id: number
  course_id: number
  course_title: string | null
  course_code: string | null
  student_id: number
  student_name: string | null
  enrollment_date: string | null
  status: string
  grade: string | null
  grade_points: number | null
  completion_percentage: number
  dropped_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AvailableCourse {
  id: number
  title: string
  code: string
  description: string | null
  credits: number
  department_name: string | null
  teacher_name: string | null
  semester: string
  academic_year: string
  max_students: number
  current_enrollment: number
  thumbnail_url: string | null
  start_date: string | null
  end_date: string | null
}

export function useMyEnrollments(status?: string) {
  return useQuery({
    queryKey: ['my-enrollments', status],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.enrollments.my, {
        params: status ? { status } : {},
      })
      return data.data as Enrollment[]
    },
  })
}

export function useAvailableCourses(search?: string) {
  return useQuery({
    queryKey: ['available-courses', search],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.enrollments.available, {
        params: search ? { search } : {},
      })
      return data.data as AvailableCourse[]
    },
  })
}

export function useCourseEnrollments(courseId: number) {
  return useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.enrollments.course(courseId))
      return (data.data?.enrollments ?? data.data ?? []) as Enrollment[]
    },
    enabled: !!courseId,
  })
}

export function useRemoveEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.enrollments.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] })
    },
  })
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (course_id: number) => {
      const { data } = await apiClient.post(ENDPOINTS.enrollments.create, null, {
        params: { course_id },
      })
      return data.data as Enrollment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['available-courses'] })
    },
  })
}
