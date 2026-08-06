'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useActiveLiveSessions, useJoinLiveSession } from '@/lib/hooks/useLiveSessions'
import { Video, Search, Loader2, Play, User, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function StudentLiveSessionsPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const { data: activeSessions, isLoading } = useActiveLiveSessions()
  const joinMutation = useJoinLiveSession()

  const handleJoinByCode = async () => {
    if (!code.trim()) return
    try {
      const session = await joinMutation.mutateAsync(code.trim().toUpperCase())
      toast.success('Joined session!')
      router.push(`/student/live-lecture/${session.id}`)
    } catch {
      toast.error('Invalid or inactive session code')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Live Sessions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Join active live sessions or enter a session code
          </p>
        </div>
      </div>

      {/* Join by Code */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <Input
            placeholder="Enter session code (e.g. ABC123)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="flex-1 font-mono tracking-widest uppercase"
            maxLength={6}
          />
          <Button onClick={handleJoinByCode} disabled={joinMutation.isPending || code.length < 4} className="w-full md:w-auto">
            {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            Join
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Active Sessions</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeSessions && activeSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(session => (
              <Link key={session.id} href={`/student/live-lecture/${session.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 dark:border-green-800">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{session.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Code: <span className="font-mono font-bold">{session.session_code}</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">LIVE</span>
                        <span className="text-xs text-gray-400">
                          {session.participant_ids?.length || 0} participant{(session.participant_ids?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-400">
              <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active live sessions in your enrolled courses</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
