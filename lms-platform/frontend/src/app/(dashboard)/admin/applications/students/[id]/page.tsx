'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStudentApplicationDetail, useReviewStudentApplication, useApproveStudentApplication, useRejectStudentApplication } from '@/lib/hooks/useApplications'
import { useDepartments } from '@/lib/hooks/useDepartments'
import { useCourses } from '@/lib/hooks/useCourses'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, CheckCircle, XCircle, Eye, FileText, Download, Loader2 } from 'lucide-react'
import type { StudentApplication, ApplicationDocument, ApplicationStatusLog } from '@/lib/types/application.types'

const statusSteps = ['submitted', 'reviewed', 'selected']

export default function AdminStudentApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = Number(params.id)
  const { data, isLoading } = useStudentApplicationDetail(applicationId)
  const reviewMutation = useReviewStudentApplication()
  const approveMutation = useApproveStudentApplication()
  const rejectMutation = useRejectStudentApplication()
  const { data: departments } = useDepartments()
  const { data: coursesData } = useCourses()

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [approveData, setApproveData] = useState({ department_id: '', course_id: '', batch: '', section: '', enrollment_date: '', admin_remarks: '' })
  const [rejectReason, setRejectReason] = useState('')
  const [rejectRemarks, setRejectRemarks] = useState('')

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (!data) return <div className="text-center py-12 text-gray-500">Application not found</div>

  const application = data.application as StudentApplication
  const documents = data.documents as ApplicationDocument[]
  const logs = (data.status_logs || []) as ApplicationStatusLog[]

  const handleReview = async () => {
    try {
      await reviewMutation.mutateAsync(applicationId)
      toast.success('Application marked as reviewed')
    } catch { toast.error('Failed to review application') }
  }

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: applicationId,
        data: {
          department_id: approveData.department_id ? Number(approveData.department_id) : undefined,
          course_id: approveData.course_id ? Number(approveData.course_id) : undefined,
          batch: approveData.batch || undefined,
          section: approveData.section || undefined,
          enrollment_date: approveData.enrollment_date || undefined,
          admin_remarks: approveData.admin_remarks || undefined,
        }
      })
      toast.success('Application approved! User has been enrolled as student.')
      setShowApproveModal(false)
    } catch { toast.error('Failed to approve application') }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return }
    try {
      await rejectMutation.mutateAsync({ id: applicationId, data: { rejection_reason: rejectReason, admin_remarks: rejectRemarks } })
      toast.success('Application rejected')
      setShowRejectModal(false)
    } catch { toast.error('Failed to reject application') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Application #{application.id}</h1>
            <p className="text-gray-500">by {application.full_name}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
          application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
          application.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
          application.status === 'selected' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          <span className="capitalize">{application.status}</span>
        </span>
      </div>

      {application.status !== 'selected' && application.status !== 'rejected' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3 flex-wrap">
          {application.status === 'submitted' && (
            <Button variant="outline" onClick={handleReview} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Mark as Reviewed
            </Button>
          )}
          <Button onClick={() => setShowApproveModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="w-4 h-4 mr-2" /> Approve & Enroll as Student
          </Button>
          <Button variant="destructive" onClick={() => setShowRejectModal(true)}>
            <XCircle className="w-4 h-4 mr-2" /> Reject
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Status Timeline</h2>
          <div className="space-y-0">
            {statusSteps.map((step, idx) => {
              const isCompleted = statusSteps.indexOf(application.status) >= idx || application.status === 'rejected'
              const isCurrent = application.status === step
              const log = logs.find((l) => l.new_status === step)
              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
                    </div>
                    {idx < statusSteps.length - 1 && <div className={`w-0.5 h-12 ${isCompleted ? 'bg-green-200' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-8">
                    <p className={`font-medium capitalize ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step}</p>
                    {log && <p className="text-xs text-gray-500 mt-1">{new Date(log.created_at!).toLocaleString()}</p>}
                    {log?.remarks && <p className="text-xs text-gray-600 mt-1">{log.remarks}</p>}
                  </div>
                </div>
              )
            })}
            {application.status === 'rejected' && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600"><XCircle className="w-5 h-5" /></div>
                </div>
                <div>
                  <p className="font-medium text-red-600">Rejected</p>
                  <p className="text-xs text-gray-500 mt-1">{logs.find((l) => l.new_status === 'rejected')?.created_at ? new Date(logs.find((l) => l.new_status === 'rejected')!.created_at!).toLocaleString() : ''}</p>
                  {logs.find((l) => l.new_status === 'rejected')?.remarks && (
                    <p className="text-xs text-gray-600 mt-1">{logs.find((l) => l.new_status === 'rejected')!.remarks}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[['Full Name', application.full_name], ['Email', application.email], ['Phone', application.phone], ['CNIC/Passport', application.cnic_passport], ['DOB', application.date_of_birth], ['Gender', application.gender], ['Address', application.address], ['City', application.city], ['Country', application.country]].map(([l, v]) => (
                <div key={l}><p className="text-gray-500">{l}</p><p className="font-medium text-gray-900 dark:text-white">{v || 'N/A'}</p></div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Academic Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[['Current Qualification', application.current_qualification], ['School/College/University', application.school_college_university], ['Previous Qualification', application.previous_qualification], ['Field of Study', application.field_of_study], ['GPA/Percentage', application.gpa_percentage], ['Learning Mode', application.learning_mode], ['Availability', application.availability]].map(([l, v]) => (
                <div key={l}><p className="text-gray-500">{l}</p><p className="font-medium text-gray-900 dark:text-white">{v || 'N/A'}</p></div>
              ))}
            </div>
            {application.interested_courses && application.interested_courses.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-500 text-sm">Interested Courses</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {application.interested_courses.map((course, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">{course}</span>
                  ))}
                </div>
              </div>
            )}
            {application.learning_category && application.learning_category.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-500 text-sm">Learning Categories</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {application.learning_category.map((cat, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
            <div className="space-y-4 text-sm">
              {application.previous_experience && (
                <div><p className="text-gray-500">Previous Experience</p><p className="text-gray-700 dark:text-gray-300 mt-1">{application.previous_experience}</p></div>
              )}
              {application.career_goals && (
                <div><p className="text-gray-500">Career Goals</p><p className="text-gray-700 dark:text-gray-300 mt-1">{application.career_goals}</p></div>
              )}
            </div>
          </div>

          {application.rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-6">
              <h2 className="font-semibold text-red-700 dark:text-red-400 mb-2">Rejection Details</h2>
              <p className="text-sm text-red-600 dark:text-red-300">{application.rejection_reason}</p>
              {application.admin_remarks && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Admin Remarks: {application.admin_remarks}</p>
              )}
            </div>
          )}

          {documents && documents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Documents</h2>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">{doc.document_type} &middot; {(doc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700"><Download className="w-4 h-4" /></a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Approve & Enroll as Student</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <select value={approveData.department_id} onChange={(e) => setApproveData({...approveData, department_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="">Select Department</option>
                  {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                <select value={approveData.course_id} onChange={(e) => setApproveData({...approveData, course_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="">Select Course</option>
                  {coursesData?.courses?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch</label>
                  <input type="text" value={approveData.batch} onChange={(e) => setApproveData({...approveData, batch: e.target.value})} placeholder="e.g. 2024-A" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                  <input type="text" value={approveData.section} onChange={(e) => setApproveData({...approveData, section: e.target.value})} placeholder="e.g. A" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enrollment Date</label>
                <input type="date" value={approveData.enrollment_date} onChange={(e) => setApproveData({...approveData, enrollment_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks (optional)</label>
                <textarea value={approveData.admin_remarks} onChange={(e) => setApproveData({...approveData, admin_remarks: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm h-20" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
              <Button onClick={handleApprove} disabled={approveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Application</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rejection Reason *</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm h-24" placeholder="Enter reason for rejection..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Remarks (optional)</label>
                <textarea value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm h-20" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
