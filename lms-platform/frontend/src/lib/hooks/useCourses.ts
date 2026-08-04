import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { Course, CourseCreatePayload, CourseListResponse, PaginatedCoursesParams } from '@/lib/types/course.types'

export function useCourses(params: PaginatedCoursesParams = {}) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.courses.list, { params })
      return data.data as CourseListResponse
    },
  })
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.courses.detail(id))
      return data.data as Course
    },
    enabled: !!id,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CourseCreatePayload) => {
      const { data } = await apiClient.post(ENDPOINTS.courses.create, payload)
      return data.data as Course
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useUpdateCourse(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<CourseCreatePayload>) => {
      const { data } = await apiClient.put(ENDPOINTS.courses.update(id), payload)
      return data.data as Course
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course', id] })
    },
  })
}

export function usePublishCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(ENDPOINTS.courses.publish(id))
      return data.data as { is_published: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course'] })
    },
  })
}

export function useUnpublishCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(ENDPOINTS.courses.unpublish(id))
      return data.data as { is_published: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course'] })
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.courses.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

// Course Deletion Request Hooks
export function useRequestCourseDeletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ courseId, reason }: { courseId: number; reason?: string }) => {
      const { data } = await apiClient.post(ENDPOINTS.courses.requestDeletion(courseId), { reason })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] })
    },
  })
}

export function useDeletionRequests(params?: { status?: string }) {
  return useQuery({
    queryKey: ['deletion-requests', params],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.courses.deletionRequests, { params })
      return data.data
    },
  })
}

export function useApproveDeletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, admin_remarks }: { requestId: number; admin_remarks?: string }) => {
      const { data } = await apiClient.post(ENDPOINTS.courses.approveDeletion(requestId), { admin_remarks })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useRejectDeletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, admin_remarks }: { requestId: number; admin_remarks?: string }) => {
      const { data } = await apiClient.post(ENDPOINTS.courses.rejectDeletion(requestId), { admin_remarks })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}
