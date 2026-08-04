import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface GradeEntry {
  id: number
  student_id: number
  student_name: string | null
  course_id: number
  course_title: string | null
  grade: string | null
  grade_points: number | null
  score: number | null
  max_score: number | null
  comments: string | null
  created_at: string
}

export function useCourseGrades(courseId: number) {
  return useQuery({
    queryKey: ['course-grades', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.grades.course(courseId))
      return (data.data?.grades ?? data.data ?? []) as GradeEntry[]
    },
    enabled: !!courseId,
  })
}

export function useUpdateGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, score }: { id: number; score: number }) => {
      const { data } = await apiClient.put(ENDPOINTS.grades.update(id), { score })
      return data.data as GradeEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-grades'] })
    },
  })
}
