'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function useNotificationSocket() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!user?.id || typeof window === 'undefined') return

    const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token')
    if (!token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/notifications?token=${token}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = undefined
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'notification') {
            const n = message.data

            queryClient.invalidateQueries({ queryKey: ['notifications'] })

            const iconMap: Record<string, string> = {
              info: 'ℹ️',
              success: '✅',
              warning: '⚠️',
              error: '❌',
            }

            const toastContent = (
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (n.link && !n.link.startsWith('/api/')) {
                    router.push(n.link)
                  }
                }}
              >
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
              </div>
            )

            toast.custom(
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm max-w-sm">
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">{iconMap[n.type] || 'ℹ️'}</span>
                  {toastContent}
                </div>
              </div>,
              { duration: 5000 }
            )
          }
        } catch {}
      }

      ws.onclose = () => {
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {}
  }, [user?.id, queryClient, router])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
