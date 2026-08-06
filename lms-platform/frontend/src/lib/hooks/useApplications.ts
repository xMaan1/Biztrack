'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

// Teacher Application Hooks
export function useMyTeacherApplication() {
  return useQuery({
    queryKey: ['teacher-application', 'my'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.teacher.myApplication)
      return res.data.data
    },
  })
}

export function useTeacherApplications(params?: { page?: number; page_size?: number; status_filter?: string; search?: string }) {
  return useQuery({
    queryKey: ['teacher-applications', params],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.teacher.list, { params })
      return res.data.data
    },
  })
}

export function useTeacherApplicationDetail(id: number) {
  return useQuery({
    queryKey: ['teacher-application', id],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.teacher.detail(id))
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useTeacherApplicationStats() {
  return useQuery({
    queryKey: ['teacher-application-stats'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.teacher.stats)
      return res.data.data
    },
  })
}

export function useSubmitTeacherApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.post(ENDPOINTS.applications.teacher.submit, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-application'] })
    },
  })
}

export function useReviewTeacherApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(ENDPOINTS.applications.teacher.review(id))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-application'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-applications'] })
    },
  })
}

export function useApproveTeacherApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiClient.post(ENDPOINTS.applications.teacher.approve(id), data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-application'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-applications'] })
    },
  })
}

export function useRejectTeacherApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { rejection_reason: string; admin_remarks?: string } }) => {
      const res = await apiClient.post(ENDPOINTS.applications.teacher.reject(id), data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-application'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-applications'] })
    },
  })
}

export function useUploadTeacherDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ applicationId, documentType, file }: { applicationId: number; documentType: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post(
        `${ENDPOINTS.applications.teacher.upload(applicationId)}?document_type=${documentType}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-application'] })
    },
  })
}

// Student Application Hooks (mirror pattern)
export function useMyStudentApplication() {
  return useQuery({
    queryKey: ['student-application', 'my'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.student.myApplication)
      return res.data.data
    },
  })
}

export function useStudentApplications(params?: { page?: number; page_size?: number; status_filter?: string; search?: string }) {
  return useQuery({
    queryKey: ['student-applications', params],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.student.list, { params })
      return res.data.data
    },
  })
}

export function useStudentApplicationDetail(id: number) {
  return useQuery({
    queryKey: ['student-application', id],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.student.detail(id))
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useStudentApplicationStats() {
  return useQuery({
    queryKey: ['student-application-stats'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.applications.student.stats)
      return res.data.data
    },
  })
}

export function useSubmitStudentApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.post(ENDPOINTS.applications.student.submit, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-application'] })
    },
  })
}

export function useReviewStudentApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(ENDPOINTS.applications.student.review(id))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-application'] })
      queryClient.invalidateQueries({ queryKey: ['student-applications'] })
    },
  })
}

export function useApproveStudentApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiClient.post(ENDPOINTS.applications.student.approve(id), data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-application'] })
      queryClient.invalidateQueries({ queryKey: ['student-applications'] })
    },
  })
}

export function useRejectStudentApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { rejection_reason: string; admin_remarks?: string } }) => {
      const res = await apiClient.post(ENDPOINTS.applications.student.reject(id), data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-application'] })
      queryClient.invalidateQueries({ queryKey: ['student-applications'] })
    },
  })
}

export function useUploadStudentDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ applicationId, documentType, file }: { applicationId: number; documentType: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post(
        `${ENDPOINTS.applications.student.upload(applicationId)}?document_type=${documentType}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-application'] })
    },
  })
}
