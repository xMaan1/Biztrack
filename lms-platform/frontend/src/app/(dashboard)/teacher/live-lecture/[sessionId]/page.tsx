'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useLiveSession } from '@/lib/hooks/useLiveSessions'
import { useEndLiveSession } from '@/lib/hooks/useLiveSessions'
import { useWebRTC } from '@/lib/hooks/useWebRTC'
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Pencil, Eraser, X, Copy, Check, LogOut, Loader2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherLiveRoomPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = Number(params?.sessionId)
  const { data: session, isLoading } = useLiveSession(sessionId)
  const endSession = useEndLiveSession()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenRef = useRef<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [sharingScreen, setSharingScreen] = useState(false)
  const [drawColor, setDrawColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)
  const [copied, setCopied] = useState(false)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [showParticipants, setShowParticipants] = useState(true)
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  const isDrawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const { remoteStreams, peers, sendWhiteboardData, sendWhiteboardClear } = useWebRTC(
    'teacher',
    session?.session_code || '',
    localStream
  )

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        setLocalStream(stream)
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch {
        toast.error('Camera/mic access denied')
      }
    }
    startMedia()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      screenRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    if (session?.session_code) setShowParticipants(true)
  }, [session?.session_code])

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => (t.enabled = !t.enabled))
    setMicOn(v => !v)
  }

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach(t => (t.enabled = !t.enabled))
    setCameraOn(v => !v)
  }

  const toggleScreenShare = async () => {
    if (sharingScreen) {
      screenRef.current?.getTracks().forEach(t => t.stop())
      screenRef.current = null
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null
      setSharingScreen(false)
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenRef.current = screen
        if (screenVideoRef.current) screenVideoRef.current.srcObject = screen
        setSharingScreen(true)
        screen.getVideoTracks()[0]?.addEventListener('ended', () => {
          screenRef.current?.getTracks().forEach(t => t.stop())
          screenRef.current = null
          if (screenVideoRef.current) screenVideoRef.current.srcObject = null
          setSharingScreen(false)
        })
      } catch {
        toast.error('Screen share cancelled')
      }
    }
  }

  const handleEndSession = async () => {
    try {
      await endSession.mutateAsync(sessionId)
      streamRef.current?.getTracks().forEach(t => t.stop())
      screenRef.current?.getTracks().forEach(t => t.stop())
      toast.success('Session ended')
      router.push('/teacher/lectures')
    } catch {
      toast.error('Failed to end session')
    }
  }

  const copyCode = () => {
    if (session?.session_code) {
      navigator.clipboard.writeText(session.session_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !showWhiteboard) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const sendCanvas = () => {
      if (sendWhiteboardData) canvas.toBlob(blob => {
        if (!blob) return
        const reader = new FileReader()
        reader.onloadend = () => sendWhiteboardData(reader.result as string)
        reader.readAsDataURL(blob)
      })
    }

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const startDraw = (e: MouseEvent | TouchEvent) => { isDrawing.current = true; lastPos.current = getPos(e) }
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return
      e.preventDefault()
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : drawColor
      ctx.lineWidth = tool === 'eraser' ? brushSize * 5 : brushSize
      ctx.lineCap = 'round'
      ctx.stroke()
      lastPos.current = pos
    }
    const stopDraw = () => { isDrawing.current = false; sendCanvas() }

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDraw)
    canvas.addEventListener('mouseleave', stopDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: true })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stopDraw)
    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDraw)
      canvas.removeEventListener('mouseleave', stopDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDraw)
    }
  }, [showWhiteboard, drawColor, brushSize, tool])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (sendWhiteboardClear) sendWhiteboardClear()
  }

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-900"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
  }

  if (!session) {
    return <div className="h-screen flex items-center justify-center bg-gray-900"><p className="text-white">Session not found</p></div>
  }

  const participantCount = peers.length

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-white font-semibold text-sm md:text-base truncate">{session.title}</h2>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/50 text-green-300 shrink-0">LIVE</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={copyCode} className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs">
            <span className="font-mono font-bold text-sm">{session.session_code}</span>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
          <button onClick={() => setShowParticipants(v => !v)} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white" title="Participants">
            <Users className="w-4 h-4" />
            {participantCount > 0 && <span className="ml-1 text-xs">{participantCount}</span>}
          </button>
          <Button variant="destructive" size="sm" onClick={handleEndSession} disabled={endSession.isPending} className="text-xs px-2 py-1 h-auto">
            <LogOut className="w-3 h-3 mr-1" /> End
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 min-h-0">
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {sharingScreen && (
            <div className="relative bg-black rounded-lg overflow-hidden flex-1 min-h-[120px]">
              <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-medium">Screen</span>
            </div>
          )}
          <div className={`relative bg-black rounded-lg overflow-hidden ${sharingScreen ? 'h-28 md:h-36' : 'flex-1 min-h-[200px]'}`}>
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-gray-900/70 text-white text-[10px] md:text-xs">You (Teacher)</div>
          </div>

          {/* Remote student streams grid */}
          {remoteStreams.size > 0 && (
            <div className="bg-gray-800 rounded-lg overflow-y-auto max-h-48">
              <p className="text-gray-400 text-xs font-medium px-3 pt-2">Students ({remoteStreams.size})</p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 p-2">
                {Array.from(remoteStreams.entries()).map(([uid, stream]) => (
                  <div key={uid} className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-gray-900/70 text-white text-[9px]">
                      Student #{uid}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showWhiteboard && (
          <div className="lg:w-96 w-full h-64 lg:h-auto bg-white rounded-lg overflow-hidden flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b shrink-0">
              <span className="text-sm font-medium">Whiteboard</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setTool('pen')} className={`p-1 rounded ${tool === 'pen' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setTool('eraser')} className={`p-1 rounded ${tool === 'eraser' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><Eraser className="w-3.5 h-3.5" /></button>
                <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} className="w-5 h-5 p-0 border-0 cursor-pointer" />
                <select value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="text-[10px] border rounded px-1 py-0.5">
                  <option value={2}>S</option><option value={5}>M</option><option value={10}>L</option>
                </select>
                <button onClick={clearCanvas} className="p-1 rounded hover:bg-gray-200 text-red-500"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex-1 relative">
              <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
            </div>
          </div>
        )}

        {showParticipants && (
          <div className="lg:w-72 w-full h-48 lg:h-auto bg-gray-800 rounded-lg overflow-hidden flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
              <span className="text-sm font-medium text-white">Participants ({participantCount})</span>
              <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm">
              {peers.map(p => (
                <div key={p.user_id} className="flex items-center gap-2 text-gray-300">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${p.role === 'student' ? 'bg-purple-500/30' : 'bg-blue-500/30'}`}>
                    {p.role === 'student' ? 'S' : 'T'}
                  </div>
                  <span>{p.role === 'student' ? 'Student' : 'Teacher'} #{p.user_id}</span>
                  {remoteStreams.has(p.user_id) && <span className="text-[9px] text-green-400 ml-auto">● Live</span>}
                </div>
              ))}
              {peers.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-xs">Waiting for participants...</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-3 px-4 py-3 bg-gray-800 border-t border-gray-700 shrink-0">
        <button onClick={toggleMic} className={`p-2.5 md:p-3 rounded-full transition-colors ${micOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}>
          {micOn ? <Mic className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5 text-white" />}
        </button>
        <button onClick={toggleCamera} className={`p-2.5 md:p-3 rounded-full transition-colors ${cameraOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}>
          {cameraOn ? <Video className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5 text-white" />}
        </button>
        <button onClick={toggleScreenShare} className={`p-2.5 md:p-3 rounded-full transition-colors ${sharingScreen ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 hover:bg-gray-500'}`}>
          {sharingScreen ? <MonitorOff className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Monitor className="w-4 h-4 md:w-5 md:h-5 text-white" />}
        </button>
        <button onClick={() => setShowWhiteboard(v => !v)} className={`p-2.5 md:p-3 rounded-full transition-colors ${showWhiteboard ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-600 hover:bg-gray-500'}`}>
          <Pencil className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </button>
      </div>
    </div>
  )
}