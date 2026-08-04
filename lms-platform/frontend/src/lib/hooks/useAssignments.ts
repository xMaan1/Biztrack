import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface AssignmentItem {
  id: number
  title: string
  description: string | null
  instructions: string | null
  course_id: number
  course_title: string | null
  max_score: number
  deadline: string | null
  is_published: boolean
  allow_late_submission: boolean
  late_submission_penalty: number
  max_file_size: number
  allowed_file_types: string
  submissions_count: number
  graded_count: number
  created_at: string
  updated_at: string
}

export interface AssignmentListResponse {
  assignments: AssignmentItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface SubmissionItem {
  id: number
  assignment_id: number
  assignment_title: string | null
  student_id: number
  student_name: string | null
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  submission_text: string | null
  is_late: boolean
  plagiarism_score: number | null
  status: string
  submitted_at: string
  graded_at: string | null
  created_at: string
  updated_at: string
  grade: number | null
  feedback: string | null
}

export interface SubmissionsResponse {
  submissions: SubmissionItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export function useAssignments(params: { course_id?: number; is_published?: boolean; page?: number; page_size?: number } = {}) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.assignments.list, { params })
      return data.data as AssignmentListResponse
    },
  })
}

export function useAssignment(id: number) {
  return useQuery({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.assignments.detail(id))
      return data.data as AssignmentItem
    },
    enabled: !!id,
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      course_id: number
      title: string
      description?: string
      instructions?: string
      max_score: number
      deadline: string
      is_published?: boolean
      allow_late_submission?: boolean
      late_submission_penalty?: number
      max_file_size?: number
      allowed_file_types?: string
    }) => {
      const { data } = await apiClient.post(ENDPOINTS.assignments.create, payload)
      return data.data as AssignmentItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.assignments.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useAssignmentSubmissions(assignmentId: number) {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.assignments.submissions(assignmentId))
      return data.data as SubmissionsResponse
    },
    enabled: !!assignmentId,
  })
}

export function useGradeSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ submissionId, score, feedback }: { submissionId: number; score: number; feedback?: string }) => {
      const { data } = await apiClient.post(ENDPOINTS.assignments.grade(submissionId), { score, feedback })
      return data.data as SubmissionItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}
