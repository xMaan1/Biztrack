'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { User, Camera, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const profilePic = user?.profile_picture_url
    ? `${baseApiUrl}${user.profile_picture_url}`
    : null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post(ENDPOINTS.users.profile + '/upload-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Profile picture updated')
      refreshUser?.()
    } catch {
      toast.error('Failed to upload picture')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-2xl">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-primary capitalize mt-0.5">{user?.role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Full Name</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.full_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
