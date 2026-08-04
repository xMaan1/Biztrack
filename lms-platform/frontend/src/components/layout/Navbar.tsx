'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks/useNotifications'
import type { NotificationItem } from '@/lib/hooks/useNotifications'
import { Menu, Bell, User, ChevronDown, Moon, Sun, LogOut, Settings, HelpCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const { data: notifData, isLoading: notifLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = notifData?.notifications ?? []
  const unreadCount = notifData?.unread_count ?? 0

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleNotifClick = async (n: NotificationItem) => {
    if (!n.is_read) await markRead.mutateAsync(n.id)
    setShowNotifications(false)
    if (n.link && !n.link.startsWith('/api/')) router.push(n.link)
  }

  const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const profilePic = user?.profile_picture_url
    ? `${baseApiUrl}${user.profile_picture_url}`
    : null

  return (
    <nav className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.role === 'admin' ? 'Admin Dashboard' : 
               user?.role === 'teacher' ? 'Teacher Dashboard' : 
               user?.role === 'public_user' ? 'Public User Dashboard' :
               'Student Dashboard'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications(v => !v)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead.mutateAsync()}
                      className="text-xs text-primary hover:text-primary/80"
                      disabled={markAllRead.isPending}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={cn(
                          'px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                          !n.is_read && 'bg-primary/5 dark:bg-primary/10'
                        )}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                        {n.created_at && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                  <button
                    onClick={() => { setShowNotifications(false); router.push('/notifications') }}
                    className="text-xs text-primary hover:text-primary/80 w-full text-center"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(v => !v)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {profilePic ? (
                <img src={profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.full_name || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {profilePic ? (
                      <img src={profilePic} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {user?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      <p className="text-xs text-primary mt-0.5 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button onClick={() => { setShowDropdown(false); router.push('/profile') }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button onClick={() => { setShowDropdown(false); router.push('/admin/settings') }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button onClick={() => { setShowDropdown(false); router.push('/help') }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help</span>
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                  <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}