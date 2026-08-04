'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCourse } from '@/lib/hooks/useCourses'
import { useCourseLectures, useDeleteLecture, usePublishLecture, useUnpublishLecture } from '@/lib/hooks/useLectures'
import { ArrowLeft, Video, Search, Plus, Eye, EyeOff, Trash2, ExternalLink, Clock, Loader2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CourseLectures() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params.courseId)
  const { data: course } = useCourse(courseId)
  const { data: lecturesData, isLoading } = useCourseLectures(courseId)
  const deleteLecture = useDeleteLecture()
  const publishLecture = usePublishLecture()
  const unpublishLecture = useUnpublishLecture()
  const [search, setSearch] = useState('')
  const lectures = lecturesData?.lectures ?? []

  const filtered = lectures.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/courses/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Lectures</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{course?.title || 'Course'}</p>
          </div>
        </div>
        <Link href="/teacher/lectures">
          <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" /> Manage Lectures</Button>
        </Link>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search lectures..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No lectures found</p>
            <Link href="/teacher/lectures"><Button variant="outline" className="mt-3">Go to Lectures</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lecture, idx) => (
            <Card key={lecture.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-12 h-12 sm:w-16 sm:h-14 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  <span className="text-[8px] sm:text-[9px] leading-tight text-center">#{String(lecture.lecture_number || idx + 1).padStart(3, '0')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/teacher/lectures/${lecture.id}`} className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate hover:text-purple-600">
                    {lecture.title}
                  </Link>
                  {lecture.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{lecture.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {lecture.video_duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.floor(lecture.video_duration / 60)}m</span>}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${lecture.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {lecture.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => {
                    if (lecture.is_published) unpublishLecture.mutateAsync(lecture.id).then(() => toast.success('Unpublished')).catch(() => {})
                    else publishLecture.mutateAsync(lecture.id).then(() => toast.success('Published')).catch(() => {})
                  }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title={lecture.is_published ? 'Unpublish' : 'Publish'}>
                    {lecture.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <Link href={`/teacher/lectures/${lecture.id}`}>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><ExternalLink className="w-3.5 h-3.5" /></button>
                  </Link>
                  <button onClick={() => { if (confirm('Delete this lecture?')) deleteLecture.mutateAsync(lecture.id).then(() => toast.success('Deleted')).catch(() => {}) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
