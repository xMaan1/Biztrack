'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useCourses } from '@/lib/hooks/useCourses'
import { useStudents } from '@/lib/hooks/useStudents'
import { useTeachers } from '@/lib/hooks/useTeachers'
import { useCourseLectures, useCreateLecture, useUpdateLecture, useDeleteLecture, usePublishLecture, useUnpublishLecture } from '@/lib/hooks/useLectures'
import { useCreateLiveSession, useMyLiveSessions, useStartLiveSession, useDeleteLiveSession } from '@/lib/hooks/useLiveSessions'
import { Video, Plus, Play, Upload, Calendar, Users, Loader2, Trash2, Clock, Monitor, Presentation, ArrowRight, Copy, Check, ExternalLink, Pencil, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function TeacherLecturesPage() {
  const router = useRouter()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [showCreateLecture, setShowCreateLecture] = useState(false)
  const [showCreateLive, setShowCreateLive] = useState(false)
  const [showEditLecture, setShowEditLecture] = useState(false)
  const [editingLecture, setEditingLecture] = useState<{ id: number; title: string; description: string } | null>(null)
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', lecture_number: 1 })
  const [lectureMedia, setLectureMedia] = useState<File[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('')
  const uploadStartRef = useRef(0)
  const uploadLoadedRef = useRef(0)
  const [liveForm, setLiveForm] = useState({ title: '', description: '', selectedLectureId: '', selectedStudents: new Set<number>(), selectedTeachers: new Set<number>(), selectedAdmins: new Set<number>() })
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const { data: coursesData } = useCourses({ page_size: 100 })
  const courses = coursesData?.courses ?? []
  const { data: lecturesData, isLoading: lecturesLoading } = useCourseLectures(selectedCourseId ? Number(selectedCourseId) : undefined)
  const lectures = lecturesData?.lectures ?? []
  const createLecture = useCreateLecture()
  const updateLecture = useUpdateLecture()
  const deleteLecture = useDeleteLecture()
  const publishLecture = usePublishLecture()
  const unpublishLecture = useUnpublishLecture()
  const createLiveSession = useCreateLiveSession()
  const startLiveSession = useStartLiveSession()
  const deleteLiveSession = useDeleteLiveSession()
  const { data: liveSessionsData } = useMyLiveSessions()
  const liveSessions = liveSessionsData?.sessions ?? []

  const selectedCourse = courses.find(c => c.id === Number(selectedCourseId))

  const handleCreateLecture = async () => {
    if (!lectureForm.title.trim() || !selectedCourseId) return
    try {
      const lecture = await createLecture.mutateAsync({
        course_id: Number(selectedCourseId),
        title: lectureForm.title,
        description: lectureForm.description,
        lecture_number: lectures.length + 1,
      })
      if (lectureMedia.length > 0) {
        setUploadingMedia(true)
        setUploadProgress(0)
        setUploadSpeed('')
        uploadStartRef.current = Date.now()
        uploadLoadedRef.current = 0
        const totalBytes = lectureMedia.reduce((s, f) => s + f.size, 0)
        const formData = new FormData()
        lectureMedia.forEach(f => formData.append('files', f))
        await axios.post(ENDPOINTS.lectures.uploadMedia(lecture.id), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 1800000,
          onUploadProgress: (e) => {
            if (!e.total) return
            const loaded = e.loaded
            const pct = Math.round((loaded / totalBytes) * 100)
            setUploadProgress(pct)
            uploadLoadedRef.current = loaded
            const elapsed = (Date.now() - uploadStartRef.current) / 1000
            if (elapsed > 2) {
              const speedBps = loaded / elapsed
              const speedMbps = (speedBps * 8) / 1024 / 1024
              setUploadSpeed(`${speedMbps.toFixed(1)} Mbps`)
            }
          },
        })
        setUploadingMedia(false)
      }
      toast.success('Lecture created' + (lectureMedia.length > 0 ? ` with ${lectureMedia.length} file(s)` : ''))
      setShowCreateLecture(false)
      setLectureForm({ title: '', description: '', lecture_number: lectures.length + 2 })
      setLectureMedia([])
    } catch (err) {
      const e: any = err
      console.error('Create lecture error:', e?.response?.data || e)
      const msg = e?.response?.data?.detail?.error?.message || e?.response?.data?.detail || e?.message || 'Failed to create lecture'
      toast.error(msg)
      setUploadingMedia(false)
    }
  }

  const handleCreateLiveSession = async () => {
    if (!liveForm.title.trim() || !selectedCourseId) return
    try {
      const session = await createLiveSession.mutateAsync({
        course_id: Number(selectedCourseId),
        lecture_id: liveForm.selectedLectureId ? Number(liveForm.selectedLectureId) : undefined,
        title: liveForm.title,
        description: liveForm.description,
        participant_ids: Array.from(liveForm.selectedStudents),
        invite_teachers: Array.from(liveForm.selectedTeachers),
        invite_admins: Array.from(liveForm.selectedAdmins),
      })
      toast.success('Live session created')
      await startLiveSession.mutateAsync(session.id)
      setShowCreateLive(false)
      setLiveForm({ title: '', description: '', selectedLectureId: '', selectedStudents: new Set(), selectedTeachers: new Set(), selectedAdmins: new Set() })
      router.push(`/teacher/live-lecture/${session.id}`)
    } catch (err) {
      const e: any = err
      console.error('Create live session error:', e?.response?.data || e)
      const msg = e?.response?.data?.detail?.error?.message || e?.response?.data?.detail || e?.message || 'Failed to create live session'
      toast.error(msg)
    }
  }

  const handleStartSession = async (id: number) => {
    try {
      await startLiveSession.mutateAsync(id)
      router.push(`/teacher/live-lecture/${id}`)
    } catch {
      toast.error('Failed to start session')
    }
  }

  const toggleStudent = (id: number) => {
    setLiveForm(prev => {
      const next = new Set(prev.selectedStudents)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...prev, selectedStudents: next }
    })
  }

  const courseLiveSessions = liveSessions.filter(s => s.course_id === Number(selectedCourseId))
  const activeSessions = courseLiveSessions.filter(s => s.status === 'active')
  const upcomingSessions = courseLiveSessions.filter(s => s.status === 'scheduled')
  const endedSessions = courseLiveSessions.filter(s => s.status === 'ended')

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Lectures</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage and organize your course lectures</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {selectedCourseId && (
            <>
              <Button variant="outline" onClick={() => { setLectureForm(f => ({ ...f, lecture_number: lectures.length + 1 })); setShowCreateLecture(true) }} className="w-full sm:w-auto text-xs md:text-sm">
                <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> Upload Lecture
              </Button>
              <Button onClick={() => setShowCreateLive(true)} className="w-full sm:w-auto text-xs md:text-sm">
                <Video className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> Live Session
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Course selector */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose a course...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {!selectedCourseId && (
        <Card>
          <CardContent className="p-8 md:p-12 text-center">
            <Presentation className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 md:mb-4" />
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Select a course to manage its lectures</p>
          </CardContent>
        </Card>
      )}

      {selectedCourseId && (
        <>
          {/* Active Live Sessions */}
          {activeSessions.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Active Live Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {activeSessions.map(s => (
                  <Card key={s.id} className="border-green-200 dark:border-green-800">
                    <CardContent className="p-3 md:p-4 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">{s.title}</p>
                        <p className="text-[11px] md:text-xs text-gray-500 mt-1">Code: <span className="font-mono font-bold text-primary">{s.session_code}</span></p>
                        <p className="text-[11px] md:text-xs text-gray-400">{s.participant_ids?.length ?? 0} participants</p>
                      </div>
                      <Button size="sm" onClick={() => router.push(`/teacher/live-lecture/${s.id}`)} className="shrink-0 text-xs md:text-sm">
                        <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Join
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Lectures Grid */}
          {lecturesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-gray-400" />
            </div>
          ) : lectures.length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <Video className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No lectures yet. Upload your first lecture!</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Course Lectures ({lectures.length})</h2>
              <div className="space-y-3">
                {lectures.map((lecture, idx) => (
                  <Card key={lecture.id} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-14 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                        <span className="text-[8px] sm:text-[9px] leading-tight text-center px-0.5">#{String(lecture.lecture_number || idx + 1).padStart(3, '0')}<br />{new Date(lecture.created_at || Date.now()).getFullYear()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/teacher/lectures/${lecture.id}`} className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate hover:text-purple-600 dark:hover:text-purple-400">{lecture.title}</Link>
                          {lecture.is_published ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shrink-0">Published</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 shrink-0">Draft</span>
                          )}
                        </div>
                        {lecture.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{lecture.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {lecture.video_duration && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.floor(lecture.video_duration / 60)}m</span>
                          )}
                          {lecture.materials_count !== undefined && (
                            <span>{lecture.materials_count} materials</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 mt-2 sm:mt-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            if (lecture.is_published) {
                              unpublishLecture.mutateAsync(lecture.id).then(() => toast.success('Unpublished')).catch(() => toast.error('Failed'))
                            } else {
                              publishLecture.mutateAsync(lecture.id).then(() => toast.success('Published')).catch(() => toast.error('Failed'))
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500"
                          title={lecture.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {lecture.is_published ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingLecture({ id: lecture.id, title: lecture.title, description: lecture.description || '' })
                            setShowEditLecture(true)
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        >
                          <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <Link href={`/teacher/courses/${lecture.course_id}`}>
                          <Button variant="ghost" size="sm"><ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
                        </Link>
                        <button onClick={() => { if (confirm('Delete this lecture?')) deleteLecture.mutateAsync(lecture.id).then(() => toast.success('Deleted')).catch(() => toast.error('Failed')) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Live Sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Scheduled Live Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {upcomingSessions.map(s => (
                  <Card key={s.id}>
                    <CardContent className="p-3 md:p-4 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">{s.title}</p>
                        <p className="text-[11px] md:text-xs text-gray-500 mt-1">Code: <span className="font-mono text-primary">{s.session_code}</span></p>
                      </div>
                      <Button size="sm" onClick={() => handleStartSession(s.id)} disabled={startLiveSession.isPending} className="shrink-0 text-xs md:text-sm">
                        <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Start Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Ended Live Sessions (History) */}
          {endedSessions.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Past Live Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {endedSessions.map(s => (
                  <Card key={s.id}>
                    <CardContent className="p-3 md:p-4 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">{s.title}</p>
                        <p className="text-[11px] md:text-xs text-gray-500 mt-1">Code: <span className="font-mono text-primary">{s.session_code}</span></p>
                        {s.ended_at && <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">Ended {new Date(s.ended_at).toLocaleDateString()}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/teacher/live-lecture/${s.id}`)} className="text-xs md:text-sm">
                          View
                        </Button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this live session?')) {
                              try {
                                await deleteLiveSession.mutateAsync(s.id)
                                toast.success('Session deleted')
                              } catch { toast.error('Failed to delete') }
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Lecture Modal */}
      <Modal open={showCreateLecture} onClose={() => setShowCreateLecture(false)} title="Upload New Lecture">
        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lecture ID</label>
            <Input value={`ID:#${(lectures.length + 1).toString().padStart(3, '0')}-${new Date().getFullYear()}`} disabled className="bg-gray-50 dark:bg-gray-800 text-xs md:text-sm" />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lecture Title</label>
            <Input value={lectureForm.title} onChange={e => setLectureForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Variables" className="text-xs md:text-sm" />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm min-h-[80px]" value={lectureForm.description} onChange={e => setLectureForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Media Files</label>
            <input ref={mediaInputRef} type="file" multiple accept="video/*,image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" onChange={e => {
              const files = Array.from(e.target.files || [])
              setLectureMedia(prev => [...prev, ...files])
              e.target.value = ''
            }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            {lectureMedia.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-32 md:max-h-40 overflow-y-auto">
                {lectureMedia.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-400 shrink-0">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button
                      onClick={() => setLectureMedia(prev => prev.filter((_, j) => j !== i))}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 shrink-0 ml-2"
                    >
                      <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {uploadingMedia && (
            <div className="space-y-1.5">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{uploadProgress}% uploaded</span>
                {uploadSpeed && <span>{uploadSpeed}</span>}
              </div>
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowCreateLecture(false); setLectureMedia([]) }} className="w-full sm:w-auto text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleCreateLecture} disabled={createLecture.isPending || uploadingMedia} className="w-full sm:w-auto text-xs md:text-sm">
              {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />}
              {uploadingMedia ? `Uploading ${uploadProgress}%` : createLecture.isPending ? 'Creating...' : 'Create & Upload'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Live Session Modal */}
      <Modal open={showCreateLive} onClose={() => setShowCreateLive(false)} title="Create Live Session">
        <div className="space-y-3 md:space-y-4 max-h-[80vh] overflow-y-auto px-1">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Title</label>
            <Input value={liveForm.title} onChange={e => setLiveForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 5 Live Review" className="text-xs md:text-sm" />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm min-h-[60px]" value={liveForm.description} onChange={e => setLiveForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link to Lecture (optional)</label>
            <select value={liveForm.selectedLectureId} onChange={e => setLiveForm(f => ({ ...f, selectedLectureId: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm">
              <option value="">No lecture linked</option>
              {lectures.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div className="border-t pt-3">
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite Students</label>
            <RoleSelector role="students" selected={liveForm.selectedStudents} onToggle={(id) => {
              setLiveForm(f => { const next = new Set(f.selectedStudents); next.has(id) ? next.delete(id) : next.add(id); return { ...f, selectedStudents: next } })
            }} />
          </div>
          <div className="border-t pt-3">
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite Teachers</label>
            <RoleSelector role="teachers" selected={liveForm.selectedTeachers} onToggle={(id) => {
              setLiveForm(f => { const next = new Set(f.selectedTeachers); next.has(id) ? next.delete(id) : next.add(id); return { ...f, selectedTeachers: next } })
            }} />
          </div>
          <div className="border-t pt-3">
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite Admins</label>
            <RoleSelector role="admins" selected={liveForm.selectedAdmins} onToggle={(id) => {
              setLiveForm(f => { const next = new Set(f.selectedAdmins); next.has(id) ? next.delete(id) : next.add(id); return { ...f, selectedAdmins: next } })
            }} />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowCreateLive(false)} className="w-full sm:w-auto text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleCreateLiveSession} disabled={createLiveSession.isPending} className="w-full sm:w-auto text-xs md:text-sm">
              {createLiveSession.isPending ? 'Creating...' : 'Create & Start'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Lecture Modal */}
      <Modal open={showEditLecture} onClose={() => setShowEditLecture(false)} title="Edit Lecture">
        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lecture Title</label>
            <Input value={editingLecture?.title || ''} onChange={e => setEditingLecture(p => p ? { ...p, title: e.target.value } : null)} placeholder="Lecture title" className="text-xs md:text-sm" />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm min-h-[80px]" value={editingLecture?.description || ''} onChange={e => setEditingLecture(p => p ? { ...p, description: e.target.value } : null)} placeholder="Optional description..." />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowEditLecture(false); setEditingLecture(null) }} className="w-full sm:w-auto text-xs md:text-sm">Cancel</Button>
            <Button onClick={async () => {
              if (!editingLecture) return
              try {
                await updateLecture.mutateAsync({ id: editingLecture.id, title: editingLecture.title, description: editingLecture.description })
                toast.success('Lecture updated')
                setShowEditLecture(false)
                setEditingLecture(null)
              } catch { toast.error('Failed to update') }
            }} disabled={updateLecture.isPending} className="w-full sm:w-auto text-xs md:text-sm">
              {updateLecture.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function RoleSelector({ role, selected, onToggle }: { role: 'students' | 'teachers' | 'admins'; selected: Set<number>; onToggle: (id: number) => void }) {
  const { data: studentsData } = role === 'students' ? useStudents() : { data: null }
  const { data: teachersData } = role === 'teachers' ? useTeachers() : { data: null }

  let users: { id: number; name: string; email: string }[] = []

  if (role === 'students' && studentsData) {
    users = studentsData.map(s => ({ id: s.id, name: `${s.profile?.first_name || ''} ${s.profile?.last_name || ''}`.trim() || s.email, email: s.email }))
  } else if (role === 'teachers' && teachersData) {
    users = teachersData.map(t => ({ id: t.id, name: `${t.profile?.first_name || ''} ${t.profile?.last_name || ''}`.trim() || t.email, email: t.email }))
  }

  return (
    <div className="max-h-36 overflow-y-auto border rounded-md divide-y text-sm">
      {users.length === 0 ? (
        <p className="text-gray-400 text-center py-3">No {role} found</p>
      ) : (
        users.map(u => (
          <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input type="checkbox" checked={selected.has(u.id)} onChange={() => onToggle(u.id)} className="rounded" />
            <span className="text-gray-900 dark:text-white">{u.name}</span>
            <span className="text-gray-400 ml-auto text-xs">{u.email}</span>
          </label>
        ))
      )}
    </div>
  )
}
