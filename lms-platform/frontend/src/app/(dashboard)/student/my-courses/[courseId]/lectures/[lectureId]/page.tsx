'use client'

import { useParams, useRouter } from 'next/navigation'
import { useLecture, useLectureMaterials } from '@/lib/hooks/useLectures'
import { useActiveLiveSessions } from '@/lib/hooks/useLiveSessions'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Download, File, FileVideo, FileText, Image, Loader2, Radio, Video } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function fileIcon(mime: string) {
  if (mime.startsWith('video/')) return <FileVideo className="w-5 h-5" />
  if (mime.startsWith('image/')) return <Image className="w-5 h-5" />
  if (mime.startsWith('text/') || mime.includes('pdf') || mime.includes('document')) return <FileText className="w-5 h-5" />
  return <File className="w-5 h-5" />
}

export default function StudentLectureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lectureId = Number(params?.lectureId)
  const courseId = Number(params?.courseId)
  const { data: lecture, isLoading } = useLecture(lectureId)
  const { data: materials } = useLectureMaterials(lectureId)
  const { data: activeSessions } = useActiveLiveSessions()

  const liveSession = (activeSessions || []).find(s => s.lecture_id === lectureId)

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  if (!lecture) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Lecture not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lecture.title}</h1>
        {lecture.description && <p className="text-gray-500 mt-1">{lecture.description}</p>}
      </div>

      {/* Live Session Banner */}
      {liveSession && (
        <Link href={`/student/live-lecture/${liveSession.id}`}>
          <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {liveSession.title}
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </p>
                {liveSession.description && <p className="text-xs text-gray-500 mt-0.5">{liveSession.description}</p>}
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white shrink-0">
                <Video className="w-4 h-4 mr-1" /> Join Live
              </Button>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Video Player */}
      {lecture.video_url && (
        <Card>
          <CardContent className="p-2">
            <video
              controls
              className="w-full rounded-lg max-h-[500px]"
              src={`${API_URL}${lecture.video_url}`}
            >
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>
      )}

      {!lecture.video_url && (
        <Card>
          <CardContent className="p-8 text-center text-gray-400">
            <FileVideo className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No video available for this lecture</p>
          </CardContent>
        </Card>
      )}

      {/* Materials */}
      <div>
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Materials ({materials?.length || 0})</h2>
        {!materials || materials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-400">
              <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No materials uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {materials.map(m => (
              <Card key={m.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="text-purple-500 shrink-0">{fileIcon(m.mime_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.file_name}</p>
                    <p className="text-xs text-gray-400">{formatSize(m.file_size)}</p>
                  </div>
                  <a
                    href={`${API_URL}${m.file_path}`}
                    download={m.file_name}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
