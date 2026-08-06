import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface Department {
  id: number
  name: string
  code: string
  description: string | null
  head_teacher_id: number | null
  head_teacher_name: string | null
  created_at: string
  updated_at: string
}

export function useDepartments(search?: string) {
  return useQuery({
    queryKey: ['departments', search],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.departments.list, {
        params: search ? { search } : {},
      })
      return data.data as Department[]
    },
  })
}

export function useDepartment(id: number) {
  return useQuery({
    queryKey: ['department', id],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.departments.detail(id))
      return data.data as Department
    },
    enabled: !!id,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; code: string; description?: string }) => {
      const { data } = await apiClient.post(ENDPOINTS.departments.create, payload)
      return data.data as Department
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; name: string; code: string; description?: string }) => {
      const { data } = await apiClient.put(ENDPOINTS.departments.update(id), payload)
      return data.data as Department
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department'] })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.departments.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}
