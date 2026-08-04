'use client'

import React, { createContext, useState, useContext } from 'react'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      createdAt: new Date(),
    }

    setNotifications(prev => [newNotification, ...prev])

    // Also show toast
    if (notification.type === 'error') {
      toast.error(notification.message, {
        duration: 4000,
        icon: '❌',
      })
    } else if (notification.type === 'success') {
      toast.success(notification.message, {
        duration: 4000,
        icon: '✅',
      })
    } else if (notification.type === 'warning') {
      toast.custom(
        <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-900 shadow-sm ring-1 ring-yellow-200">
          {notification.message}
        </div>,
        {
          duration: 4000,
        }
      )
    } else {
      toast(notification.message, {
        duration: 4000,
        icon: 'ℹ️',
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}