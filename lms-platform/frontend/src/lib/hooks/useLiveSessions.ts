import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface LiveSession {
  id: number
  course_id: number
  lecture_id: number | null
  teacher_id: number
  title: string
  description: string | null
  session_code: string
  status: string
  participant_ids: number[] | null
  invite_teachers: number[] | null
  invite_admins: number[] | null
  started_at: string | null
  ended_at: string | null
  created_at: string | null
}

export function useMyLiveSessions() {
  return useQuery({
    queryKey: ['live-sessions', 'my'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.liveSessions.my)
      return data.data as { sessions: LiveSession[]; total: number }
    },
  })
}

export function useLiveSession(id?: number) {
  return useQuery({
    queryKey: ['live-session', id],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.liveSessions.detail(id!))
      return data.data as LiveSession
    },
    enabled: !!id,
  })
}

export function useLiveSessionByCode(code?: string) {
  return useQuery({
    queryKey: ['live-session', 'code', code],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.liveSessions.joinByCode(code!))
      return data.data as LiveSession
    },
    enabled: !!code,
  })
}

export function useCreateLiveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { course_id: number; lecture_id?: number; title: string; description?: string; participant_ids?: number[]; invite_teachers?: number[]; invite_admins?: number[] }) => {
      const { data } = await apiClient.post(ENDPOINTS.liveSessions.create, payload)
      return data.data as LiveSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
    },
  })
}

export function useStartLiveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(ENDPOINTS.liveSessions.start(id))
      return data.data as LiveSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['live-session'] })
    },
  })
}

export function useEndLiveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(ENDPOINTS.liveSessions.end(id))
      return data.data as LiveSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['live-session'] })
    },
  })
}

export function useJoinLiveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post(ENDPOINTS.liveSessions.join(code))
      return data.data as LiveSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-session'] })
    },
  })
}

export function useActiveLiveSessions() {
  return useQuery({
    queryKey: ['live-sessions', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.liveSessions.active)
      return data.data as LiveSession[]
    },
    refetchInterval: 15000,
  })
}

export function useDeleteLiveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.liveSessions.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
    },
  })
}
