'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification, useClearAllNotifications } from '@/lib/hooks/useNotifications'
import { Bell, Check, CheckCheck, Trash2, Loader2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const router = useRouter()
  const { data, isLoading } = useNotifications(false, 100)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotif = useDeleteNotification()
  const clearAll = useClearAllNotifications()

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unread_count ?? 0

  const handleClick = async (n: typeof notifications[0]) => {
    if (!n.is_read) await markRead.mutateAsync(n.id)
    if (n.link && !n.link.startsWith('/api/')) router.push(n.link)
  }

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    deleteNotif.mutate(id)
  }

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      clearAll.mutateAsync().then(res => {
        toast.success(`${res.deleted_count} notifications cleared`)
      }).catch((err: unknown) => {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to clear notifications'
        toast.error(msg)
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount} unread &middot; {notifications.length} total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutateAsync()} disabled={markAllRead.isPending}>
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} disabled={clearAll.isPending} className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors border ${
                !n.is_read
                  ? 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                n.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                n.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                n.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                'bg-primary/10 text-primary'
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {n.created_at && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  )}
                  {n.link && !n.link.startsWith('/api/') && (
                    <span className="text-[11px] text-primary flex items-center gap-0.5">
                      <ExternalLink className="w-3 h-3" /> Open
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead.mutateAsync(n.id) }}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
