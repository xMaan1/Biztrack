'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  ArrowLeft, Search, Users, Download, FileText, Loader2, Award,
  FileType, Eye, ExternalLink, X, Image as ImageIcon
} from 'lucide-react'
import { useAssignmentSubmissions, useGradeSubmission } from '@/lib/hooks/useAssignments'
import apiClient from '@/lib/api/client'
import toast from 'react-hot-toast'

function FilePreview({ submission, onClose }: { submission: { id: number; file_name: string; file_path: string; mime_type: string }; onClose: () => void }) {
  const url = submission.file_path || `/api/v1/assignments/submissions/${submission.id}/download`
  const mime = submission.mime_type || ''
  const name = submission.file_name || ''
  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
  const isPdf = mime === 'application/pdf' || name.endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-sm font-medium truncate">{name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
            </a>
            <a href={url} download={name} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isImage ? (
            <img src={url} alt={name} className="max-w-full mx-auto rounded-lg" />
          ) : isPdf ? (
            <iframe src={url} className="w-full h-[70vh] rounded-lg border" title={name} />
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Preview not available for this file type</p>
              <a href={url} download={name} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" /> Download {name}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = Number(params.assignmentId)
  const [search, setSearch] = useState('')
  const [grading, setGrading] = useState<{ [key: number]: { grade: string; feedback: string } }>({})
  const [preview, setPreview] = useState<{ id: number; file_name: string; file_path: string; mime_type: string } | null>(null)
  const gradeSubmission = useGradeSubmission()

  const { data: submissionsData, isLoading } = useAssignmentSubmissions(assignmentId)
  const submissions = submissionsData?.submissions ?? []

  const filtered = submissions.filter(s =>
    (s.student_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleGrade = async (submissionId: number) => {
    const g = grading[submissionId]
    if (!g || !g.grade) { toast.error('Enter a grade'); return }
    try {
      await gradeSubmission.mutateAsync({
        submissionId,
        score: Number(g.grade),
        feedback: g.feedback || undefined,
      })
      setGrading(prev => { const next = { ...prev }; delete next[submissionId]; return next })
      toast.success('Grade submitted')
    } catch { toast.error('Failed to grade') }
  }

  const handleDownload = async (submissionId: number, fileName: string) => {
    try {
      const response = await apiClient.get(`/api/v1/assignments/submissions/${submissionId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch {
      toast.error('Download failed')
    }
  }

  const handleExport = async (submissionId: number, format: string, fileName: string) => {
    try {
      const response = await apiClient.get(`/api/v1/assignments/submissions/${submissionId}/export?format=${format}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {preview && <FilePreview submission={preview} onClose={() => setPreview(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/teacher/assignments')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Submissions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Assignment #{assignmentId} &mdash; {submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search by student name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No submissions received yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {(s.student_name || 'S').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">{s.student_name || 'Unknown Student'}</h3>
                        <p className="text-xs text-gray-500">Submitted {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'N/A'}</p>
                      </div>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                        s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{s.status}</span>
                    </div>

                    {s.submission_text && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Submission Text</p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: s.submission_text }} />
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.file_path && s.file_name && (
                        <button
                          onClick={() => setPreview({ id: s.id, file_name: s.file_name, file_path: s.file_path, mime_type: s.mime_type })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View File
                        </button>
                      )}
                      {s.file_path && s.file_name && (
                        <button
                          onClick={() => handleDownload(s.id, s.file_name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download {s.file_name}
                        </button>
                      )}
                      {s.submission_text && (
                        <>
                          <button
                            onClick={() => handleExport(s.id, 'docx', `${s.student_name || 'submission'}_assignment${assignmentId}.docx`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                          >
                            <FileType className="w-3.5 h-3.5" /> Export .docx
                          </button>
                          <button
                            onClick={() => handleExport(s.id, 'html', `${s.student_name || 'submission'}_assignment${assignmentId}.html`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> Export HTML
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="lg:w-72 shrink-0 space-y-3 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-3 lg:pt-0 lg:pl-4">
                    {s.status === 'graded' && s.grade !== null ? (
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{s.grade}</p>
                        <p className="text-xs text-gray-500">Grade</p>
                        {s.feedback && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">&quot;{s.feedback}&quot;</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Grade (out of 100)</label>
                          <Input type="number" placeholder="Enter grade" value={grading[s.id]?.grade || ''} onChange={e => setGrading(prev => ({ ...prev, [s.id]: { ...prev[s.id], grade: e.target.value, feedback: prev[s.id]?.feedback || '' } }))} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Feedback</label>
                          <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[60px]" placeholder="Optional feedback..." value={grading[s.id]?.feedback || ''} onChange={e => setGrading(prev => ({ ...prev, [s.id]: { grade: prev[s.id]?.grade || '', feedback: e.target.value } }))} />
                        </div>
                        <Button size="sm" className="w-full" onClick={() => handleGrade(s.id)} disabled={!grading[s.id]?.grade || gradeSubmission.isPending}>
                          <Award className="w-3.5 h-3.5 mr-1" /> Submit Grade
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
