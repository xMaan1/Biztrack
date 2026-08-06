'use client'

import { useParams, useRouter } from 'next/navigation'
import { useLecture, useLectureMaterials } from '@/lib/hooks/useLectures'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Download, File, FileVideo, FileText, Image, Loader2 } from 'lucide-react'

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

export default function LectureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lectureId = Number(params?.lectureId)
  const { data: lecture, isLoading } = useLecture(lectureId)
  const { data: materials } = useLectureMaterials(lectureId)

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
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>ID:#{lecture.lecture_number.toString().padStart(3, '0')}-{new Date(lecture.created_at).getFullYear()}</span>
          {lecture.is_published ? (
            <span className="text-green-600 font-medium">Published</span>
          ) : (
            <span className="text-yellow-600 font-medium">Draft</span>
          )}
        </div>
      </div>

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

      {/* Materials */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Materials ({materials?.length || 0})</h2>
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
