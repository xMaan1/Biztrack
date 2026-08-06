'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, FileText, Download, Search, BookOpen, Loader2, File, Image, Video, FileArchive, ExternalLink, Clock } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useCourse } from '@/lib/hooks/useCourses'
import { useCourseLectures } from '@/lib/hooks/useLectures'

interface Material {
  id: number
  lecture_id: number
  lecture_title: string | null
  title: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  is_downloadable: boolean
  created_at: string
}

export default function CourseMaterialsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params.courseId)
  const { data: course } = useCourse(courseId)
  const { data: lecturesData } = useCourseLectures(courseId)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMaterials()
  }, [courseId])

  const loadMaterials = async () => {
    const lectures = lecturesData?.lectures ?? []
    const allMaterials: Material[] = []
    for (const lecture of lectures) {
      try {
        const { data } = await apiClient.get(ENDPOINTS.lectures.materials(lecture.id))
        const mats = data.data ?? []
        allMaterials.push(...mats.map((m: Material) => ({ ...m, lecture_title: lecture.title })))
      } catch {}
    }
    setMaterials(allMaterials)
    setLoading(false)
  }

  const filtered = materials.filter(m =>
    (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.file_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.lecture_title || '').toLowerCase().includes(search.toLowerCase())
  )

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive
    return File
  }

  const getFileSizeStr = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push(`/student/my-courses/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Course Materials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{course?.title || 'Course'} &mdash; {materials.length} files</p>
        </div>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No materials available for this course</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No materials match your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(m => {
            const Icon = getFileIcon(m.mime_type)
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.title || m.file_name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{m.file_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{getFileSizeStr(m.file_size)}</span>
                        <span>|</span>
                        <span>{m.mime_type.split('/')[0]}</span>
                      </div>
                      {m.lecture_title && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {m.lecture_title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a href={m.file_path} target="_blank" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" /> View
                      </Button>
                    </a>
                    {m.is_downloadable && (
                      <a href={m.file_path} download className="flex-1">
                        <Button size="sm" className="w-full text-xs">
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
