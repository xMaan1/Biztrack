import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { Teacher } from '@/lib/types/user.types'

export function useTeachers(departmentId?: number) {
  return useQuery({
    queryKey: ['teachers', departmentId ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' })
      if (departmentId) params.set('department_id', String(departmentId))
      const { data } = await apiClient.get(`${ENDPOINTS.users.teachers}?${params}`)
      return data.data.users as Teacher[]
    },
  })
}
