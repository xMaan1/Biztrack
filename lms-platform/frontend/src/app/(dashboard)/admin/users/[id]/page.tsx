'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { User } from '@/lib/types/user.types'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    apiClient.get(ENDPOINTS.users.detail(Number(userId)))
      .then(res => setUser(res.data.data))
      .catch((err) => { console.error('Failed to load user:', err); toast.error('Failed to load user') })
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-gray-500">Loading...</p></div>

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-gray-500">User not found</p>
      <Button variant="outline" onClick={() => router.push('/admin/users')}>Back to Users</Button>
    </div>
  )

  const getName = () => user.profile ? `${user.profile.first_name} ${user.profile.last_name}` : user.email

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {getName().charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{getName()}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>{user.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-xs font-medium text-gray-500 uppercase">Role</p><p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{user.role}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Department</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{user.department_name || 'N/A'}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Phone</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{user.profile?.phone || 'N/A'}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Verified</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{user.is_verified ? 'Yes' : 'No'}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Created</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">User ID</p><p className="mt-1 text-sm text-gray-900 dark:text-white">#{user.id}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
