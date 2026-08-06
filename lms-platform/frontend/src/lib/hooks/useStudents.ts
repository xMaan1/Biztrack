import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface StudentUser {
  id: number
  email: string
  profile: { first_name: string; last_name: string } | null
}

export function useStudents(params?: { course_id?: number }) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.users.students, { params: { limit: 200, ...params } })
      return data.data.users as StudentUser[]
    },
  })
}
