import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface NotificationItem {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string | null
}

interface NotificationsResponse {
  notifications: NotificationItem[]
  total: number
  unread_count: number
}

export function useNotifications(unreadOnly = false, limit = 50) {
  return useQuery({
    queryKey: ['notifications', unreadOnly, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.notifications.list, {
        params: { limit, unread_only: unreadOnly },
      })
      return data.data as NotificationsResponse
    },
    refetchInterval: 120000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.put(ENDPOINTS.notifications.markRead(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.put(ENDPOINTS.notifications.markAllRead)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.notifications.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete(ENDPOINTS.notifications.clearAll)
      return data.data as { deleted_count: number }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
