'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useLiveSession, useJoinLiveSession } from '@/lib/hooks/useLiveSessions'
import { useWebRTC } from '@/lib/hooks/useWebRTC'
import { Mic, MicOff, Video, VideoOff, Loader2, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentLiveJoinPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = Number(params?.sessionId)

  const [joined, setJoined] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)

  const { data: session, isLoading } = useLiveSession(sessionId || undefined)
  const joinMutation = useJoinLiveSession()

  const { remoteStreams, peers, whiteboardDataUrl } = useWebRTC(
    'student',
    session?.session_code || '',
    localStream
  )

  const doJoin = useCallback(async () => {
    if (!session || joined) return
    try {
      await joinMutation.mutateAsync(session.session_code)
      setJoined(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
    } catch {
      toast.error('Failed to join session')
    }
  }, [session, joined, joinMutation])

  useEffect(() => { doJoin() }, [doJoin])

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => (t.enabled = !t.enabled))
    setMicOn(v => !v)
  }

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach(t => (t.enabled = !t.enabled))
    setCameraOn(v => !v)
  }

  useEffect(() => {
    return () => { localStream?.getTracks().forEach(t => t.stop()) }
  }, [localStream])

  const stopAllTracks = useCallback(() => {
    localStream?.getTracks().forEach(t => t.stop())
  }, [localStream])

  const handleLeave = () => {
    stopAllTracks()
    router.push('/student/live-sessions')
  }

  const remoteArray = Array.from(remoteStreams.entries())

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Session not found</p>
            <Button className="mt-4" onClick={() => router.push('/student/live-sessions')}>Go to Live Sessions</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {!joined ? (
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-gray-500">Joining session...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-5xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
              <h2 className="text-white font-semibold text-base md:text-lg">{session.title}</h2>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-300">Connected ({remoteArray.length + 1} participants)</span>
            </div>
            <Button variant="outline" onClick={handleLeave} className="text-white border-gray-600 w-full md:w-auto">
              Leave
            </Button>
          </div>

          {/* All participant videos grid */}
          <div className={`grid gap-3 ${remoteArray.length > 1 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Self video */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff className="w-8 h-8 text-gray-500" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-gray-900/70 text-white text-xs">You</div>
            </div>

            {/* Remote streams */}
            {remoteArray.map(([uid, stream]) => {
              const p = peers.find(p => p.user_id === uid)
              const label = p?.role === 'teacher' ? 'Teacher' : `Student #${uid}`
              return (
                <div key={uid} className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-gray-900/70 text-white text-xs">{label}</div>
                </div>
              )
            })}

            {/* Empty teacher placeholder */}
            {remoteArray.length === 0 && (
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Waiting for streams...</p>
                </div>
              </div>
            )}
          </div>

          {/* Whiteboard from teacher */}
          {whiteboardDataUrl && (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-gray-100 border-b">
                <span className="text-xs font-medium text-gray-600">Whiteboard</span>
              </div>
              <img src={whiteboardDataUrl} alt="Whiteboard" className="w-full max-h-64 object-contain" />
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button onClick={toggleMic} className={`p-3 rounded-full transition-colors ${micOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}>
              {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>
            <button onClick={toggleCamera} className={`p-3 rounded-full transition-colors ${cameraOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}>
              {cameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}