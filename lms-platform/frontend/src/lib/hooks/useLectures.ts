import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface Lecture {
  id: number
  course_id: number
  title: string
  description: string | null
  lecture_number: number
  video_url: string | null
  video_duration: number | null
  thumbnail_url: string | null
  is_published: boolean
  is_free_preview: boolean
  order_index: number
  created_at: string
  updated_at: string
  materials_count?: number
}

interface LecturesResponse {
  lectures: Lecture[]
  total: number
}

export function useCourseLectures(courseId?: number) {
  return useQuery({
    queryKey: ['lectures', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.lectures.list(courseId!))
      return data.data as LecturesResponse
    },
    enabled: !!courseId,
  })
}

export function useLecture(id: number) {
  return useQuery({
    queryKey: ['lecture', id],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.lectures.detail(id))
      return data.data as Lecture
    },
    enabled: !!id,
  })
}

export function useCreateLecture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { course_id: number; title: string; description?: string; lecture_number: number }) => {
      const { data } = await apiClient.post(ENDPOINTS.lectures.create(payload.course_id), {
        title: payload.title,
        description: payload.description,
        lecture_number: payload.lecture_number,
      })
      return data.data as Lecture
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] })
    },
  })
}

export function useUpdateLecture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: number; title?: string; description?: string }) => {
      const { data } = await apiClient.put(ENDPOINTS.lectures.update(payload.id), {
        title: payload.title,
        description: payload.description,
      })
      return data.data as Lecture
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] })
    },
  })
}

export function usePublishLecture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(ENDPOINTS.lectures.publish(id))
      return data.data as Lecture
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] })
    },
  })
}

export function useUnpublishLecture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(ENDPOINTS.lectures.unpublish(id))
      return data.data as Lecture
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] })
    },
  })
}

export function useDeleteLecture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.lectures.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] })
    },
  })
}

export interface LectureMaterial {
  id: number
  lecture_id: number
  title: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  is_downloadable: boolean
  created_at: string
}

export function useLectureMaterials(lectureId?: number) {
  return useQuery({
    queryKey: ['lecture-materials', lectureId],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.lectures.materials(lectureId!))
      return data.data as LectureMaterial[]
    },
    enabled: !!lectureId,
  })
}
