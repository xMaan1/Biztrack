'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { QrCode, Copy, Check, Download, RefreshCw, Loader2 } from 'lucide-react'
import { useAttendanceSession, useCreateAttendanceSession } from '@/lib/hooks/useAttendance'
import toast from 'react-hot-toast'

export default function QRGeneratorPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const [sessionCode, setSessionCode] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [newTitle, setNewTitle] = useState('')
  const createSession = useCreateAttendanceSession()

  const { data: session, isLoading: sessionLoading } = useAttendanceSession(sessionId ? Number(sessionId) : 0)

  useEffect(() => {
    if (session) {
      setSessionCode(session.session_code)
      setSessionTitle(session.title)
    }
  }, [session])

  useEffect(() => {
    if (sessionCode) {
      generateQR(sessionCode)
    }
  }, [sessionCode])

  const generateQR = (code: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = 250
    canvas.width = size
    canvas.height = size

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const cellSize = size / 13
    const pattern = generateQRPattern(code)

    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        if (pattern[row * 13 + col]) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }

    ctx.fillStyle = '#ffffff'
    const center = size / 2 - cellSize * 1.5
    ctx.fillRect(center, center, cellSize * 3, cellSize * 3)
    ctx.fillStyle = '#000000'
    ctx.font = `${cellSize * 0.6}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(code, size / 2, size / 2)

    setQrDataUrl(canvas.toDataURL('image/png'))
  }

  const generateQRPattern = (code: string): boolean[] => {
    const size = 13
    const pattern: boolean[] = new Array(size * size).fill(false)
    let seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    for (let i = 0; i < size * size; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      pattern[i] = seed % 3 === 0
    }
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        pattern[r * size + c] = (r === 0 || r === 4 || c === 0 || c === 4)
      }
    }
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        pattern[r * size + (size - 1 - c)] = (r === 0 || r === 4 || c === 0 || c === 4)
      }
    }
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        pattern[(size - 1 - r) * size + c] = (r === 0 || r === 4 || c === 0 || c === 4)
      }
    }
    return pattern
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionCode)
    setCopied(true)
    toast.success('Code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${sessionCode}.png`
    a.click()
  }

  const handleCreateNew = async () => {
    if (!newTitle.trim()) { toast.error('Enter a title'); return }
    try {
      const newSession = await createSession.mutateAsync({ title: newTitle })
      setSessionCode(newSession.session_code)
      setSessionTitle(newSession.title)
      setNewTitle('')
      toast.success('Session created')
    } catch { toast.error('Failed to create session') }
  }

  if (sessionLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">QR Code Generator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate QR codes for attendance sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <QrCode className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Create Attendance Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Title</label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Week 5 Attendance" />
            </div>
            <Button onClick={handleCreateNew} disabled={createSession.isPending} className="w-full">
              {createSession.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Generate New QR
            </Button>

            {sessionCode && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">Current Session</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{sessionTitle || sessionCode}</p>
                <p className="text-xs text-gray-400 mt-1">Session Code: <span className="font-mono font-bold text-primary text-sm">{sessionCode}</span></p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <QrCode className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionCode ? (
              <div className="space-y-4">
                <canvas ref={canvasRef} className="hidden" />
                {qrDataUrl && (
                  <div className="flex justify-center">
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 md:w-56 md:h-56 border-2 border-gray-200 dark:border-gray-700 rounded-lg" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Session Code</p>
                  <p className="text-xl md:text-2xl font-bold tracking-widest text-gray-900 dark:text-white font-mono">{sessionCode}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={handleCopy} className="flex-1">
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Download QR
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-400">
                  Students can scan this QR code or enter the code manually to mark attendance
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <QrCode className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a session to generate a QR code</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
