'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCourseLectures } from '@/lib/hooks/useLectures'
import { useActiveLiveSessions } from '@/lib/hooks/useLiveSessions'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, FileVideo, Loader2, Play, Video, Radio } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function StudentLecturesPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = Number(params?.courseId)
  const { data: lecturesData, isLoading } = useCourseLectures(courseId)
  const { data: activeSessions } = useActiveLiveSessions()
  const lectures = lecturesData?.lectures ?? []

  const courseLiveSessions = (activeSessions || []).filter(s => s.course_id === courseId)
  const lectureLiveMap: Record<number, any> = {}
  courseLiveSessions.forEach(s => {
    if (s.lecture_id) lectureLiveMap[s.lecture_id] = s
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Course Lectures</h1>

      {/* Active live sessions banner */}
      {courseLiveSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-red-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Now
          </h2>
          {courseLiveSessions.map(session => (
            <Link key={session.id} href={`/student/live-lecture/${session.id}`}>
              <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20 hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <Radio className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{session.title}</p>
                    {session.description && <p className="text-xs text-gray-500 mt-0.5">{session.description}</p>}
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white shrink-0">
                    <Video className="w-4 h-4 mr-1" /> Join Live
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : lectures.length === 0 ? (
        <Card>
           <CardContent className="p-8 md:p-12 text-center">
            <FileVideo className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No lectures available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture, idx) => {
            const liveSession = lectureLiveMap[lecture.id]
            return (
              <Link key={lecture.id} href={liveSession ? `/student/live-lecture/${liveSession.id}` : `/student/my-courses/${courseId}/lectures/${lecture.id}`}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer group ${liveSession ? 'border-l-4 border-l-red-500' : ''}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-16 h-14 rounded-lg ${liveSession ? 'bg-red-500' : 'bg-gradient-to-br from-purple-500 to-indigo-600'} flex items-center justify-center text-white font-bold shrink-0`}>
                      {liveSession ? (
                        <Radio className="w-6 h-6 animate-pulse" />
                      ) : (
                        <span className="text-[9px] leading-tight text-center px-0.5">#{String(lecture.lecture_number || idx + 1).padStart(3, '0')}<br />{new Date(lecture.created_at).getFullYear()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {liveSession ? liveSession.title : lecture.title}
                        {liveSession && <span className="ml-2 text-[10px] text-red-500 font-semibold">LIVE</span>}
                      </p>
                      {(lecture.description || liveSession?.description) && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{liveSession?.description || lecture.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {lecture.video_url && !liveSession && <span className="flex items-center gap-1"><Play className="w-3 h-3" />Video</span>}
                      </div>
                    </div>
                    {liveSession && (
                      <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white shrink-0 text-xs">
                        Join Live
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}