'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, FileText, Clock, Upload, CheckCircle, AlertCircle, Loader2, Download, Award, Calendar, File, X } from 'lucide-react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import apiClient from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import toast from 'react-hot-toast'

interface AssignmentDetail {
  id: number
  title: string
  description: string | null
  course_id: number
  course_title: string | null
  due_date: string | null
  max_score: number
  assignment_type: string
  instructions: string | null
  created_at: string
}

interface SubmissionInfo {
  id: number
  submission_text: string | null
  file_name: string
  file_path: string
  file_size: number
  submitted_at: string
  grade: number | null
  feedback: string | null
  status: string
}

export default function StudentAssignmentDetail() {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.assignmentId
  const assignmentId = Number(Array.isArray(rawId) ? rawId[0] : rawId)
  const isValidId = !isNaN(assignmentId) && assignmentId > 0
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionType, setSubmissionType] = useState<'text' | 'file' | 'both'>('text')

  useEffect(() => {
    if (!isValidId) {
      setLoading(false)
      return
    }
    Promise.all([
      apiClient.get(ENDPOINTS.assignments.detail(assignmentId)),
      apiClient.get(`${ENDPOINTS.assignments.submissions(assignmentId)}/my`).catch(() => null),
    ]).then(([assRes, subRes]) => {
      setAssignment(assRes.data.data)
      if (subRes?.data?.data) setSubmission(subRes.data.data)
    }).catch(() => toast.error('Failed to load assignment'))
      .finally(() => setLoading(false))
  }, [assignmentId, isValidId])

  const handleSubmit = async () => {
    const hasText = content.trim().length > 0
    const hasFile = !!file
    if (!hasText && !hasFile) { toast.error('Add content or a file'); return }
    if (submissionType === 'text' && !hasText) { toast.error('Write your content before submitting'); return }
    if (submissionType === 'file' && !hasFile) { toast.error('Attach a file before submitting'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      if (hasText) formData.append('content', content)
      if (hasFile) formData.append('file', file)
      const { data } = await apiClient.post(ENDPOINTS.assignments.submit(assignmentId), formData)
      setSubmission(data.data)
      setContent('')
      setFile(null)
      toast.success('Assignment submitted!')
    } catch (err: any) {
      const status = err?.response?.status
      const data = err?.response?.data
      console.error(`Submit error [${status || 'network'}]:`, data || err?.message)
      const detail = data?.detail
      const errMsg = data?.error?.message || data?.message || (typeof detail === 'string' ? detail : '') || (typeof detail === 'object' && detail?.error?.message) || err?.message || ''
      if (errMsg) {
        toast.error(errMsg)
      } else if (data?.errors?.length) {
        toast.error(data.errors.map((e: any) => e.message || e.detail || JSON.stringify(e)).join(', '))
      } else {
        toast.error(status ? `Submission failed (HTTP ${status})` : 'Network error — is the server running?')
      }
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  if (!isValidId) return <div className="text-center py-20 text-gray-500">Invalid assignment ID</div>
  if (!assignment) return <div className="text-center py-20 text-gray-500">Assignment not found</div>

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded'

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/student/assignments')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{assignment.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {assignment.course_title && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{assignment.course_title}</span>}
                {assignment.due_date && (
                  <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                    <Calendar className="w-3.5 h-3.5" /> Due: {new Date(assignment.due_date).toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Max Score: {assignment.max_score}</span>
              </div>
              {assignment.description && <p className="text-sm text-gray-700 dark:text-gray-300">{assignment.description}</p>}
              {assignment.instructions && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Instructions</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{assignment.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {!isSubmitted && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Upload className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Your Submission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${submissionType === 'text' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <input type="radio" name="stype" value="text" checked={submissionType === 'text'} onChange={() => setSubmissionType('text')} className="sr-only" />
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">Text Only</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${submissionType === 'file' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <input type="radio" name="stype" value="file" checked={submissionType === 'file'} onChange={() => setSubmissionType('file')} className="sr-only" />
                    <File className="w-4 h-4" />
                    <span className="text-sm font-medium">File Only</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${submissionType === 'both' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <input type="radio" name="stype" value="both" checked={submissionType === 'both'} onChange={() => setSubmissionType('both')} className="sr-only" />
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Both</span>
                  </label>
                </div>

                {(submissionType === 'text' || submissionType === 'both') && (
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content / Notes</label>
                    <RichTextEditor content={content} onChange={setContent} placeholder="Write your answer or notes here..." minHeight={250} />
                  </div>
                )}

                {(submissionType === 'file' || submissionType === 'both') && (
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Upload</label>
                    {file ? (
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button onClick={() => setFile(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors" title="Remove file">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Click to upload a file</span>
                        <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                      </label>
                    )}
                  </div>
                )}

                <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
                {isOverdue && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" /> This assignment is past due
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {submission && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  Submission Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`p-3 rounded-lg text-center ${submission.status === 'graded' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{submission.status}</p>
                  <p className="text-xs text-gray-500">{new Date(submission.submitted_at).toLocaleString()}</p>
                </div>
                {submission.grade !== null && (
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{submission.grade}</p>
                    <p className="text-xs text-gray-500">out of {assignment.max_score}</p>
                  </div>
                )}
                {submission.feedback && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Feedback</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">&quot;{submission.feedback}&quot;</p>
                  </div>
                )}
                {submission.file_path && (
                  <a href={submission.file_path} target="_blank" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Download className="w-4 h-4" /> Download File{submission.file_name ? ` (${submission.file_name})` : ''}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{assignment.assignment_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Max Score</span><span className="font-medium">{assignment.max_score}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`font-medium ${isSubmitted ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                  {isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
