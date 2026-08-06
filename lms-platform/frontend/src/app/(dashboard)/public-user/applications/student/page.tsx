'use client'

import { useMyStudentApplication, useStudentApplicationDetail } from '@/lib/hooks/useApplications'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, FileText } from 'lucide-react'

const statusSteps = ['submitted', 'reviewed', 'selected']

function StatusTimeline({ currentStatus, logs }: { currentStatus: string; logs: Array<{ new_status: string; remarks?: string; created_at?: string }> }) {
  return (
    <div className="space-y-0">
      {statusSteps.map((step, idx) => {
        const isCompleted = statusSteps.indexOf(currentStatus) >= idx || currentStatus === 'rejected'
        const isCurrent = currentStatus === step
        const log = logs.find(l => l.new_status === step)
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
              {log && <p className="text-sm text-gray-500 mt-1">{new Date(log.created_at!).toLocaleString()}</p>}
              {log?.remarks && <p className="text-sm text-gray-600 mt-1">{log.remarks}</p>}
            </div>
          </div>
        )
      })}
      {currentStatus === 'rejected' && (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-medium text-red-600">Rejected</p>
            {logs.find(l => l.new_status === 'rejected') && (
              <p className="text-sm text-gray-500 mt-1">{new Date(logs.find(l => l.new_status === 'rejected')!.created_at!).toLocaleString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentApplicationDetailPage() {
  const router = useRouter()
  const { data: myApp } = useMyStudentApplication()
  const { data, isLoading } = useStudentApplicationDetail(myApp?.id || 0)

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (!data) return <div className="text-center py-12 text-gray-500">No application found</div>

  const { application, documents, status_logs } = data
  const logs = status_logs || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Application</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Status</h2>
          <StatusTimeline currentStatus={application.status} logs={logs} />
        </div>

        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Full Name', application.full_name],
                ['Email', application.email],
                ['Phone', application.phone],
                ['CNIC', application.cnic],
                ['Gender', application.gender],
                ['Date of Birth', application.date_of_birth],
                ['City', application.city],
                ['Country', application.country],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Academic Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Current Qualification', application.current_qualification],
                ['School / College / University', application.school_college_university],
                ['Field of Study', application.field_of_study],
                ['Year of Study', application.year_of_study],
                ['GPA / Percentage', application.gpa_percentage],
                ['Board / University', application.board_or_university],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
            <div className="space-y-4 text-sm">
              {[
                ['Interested Courses', application.interested_courses],
                ['Career Goals', application.career_goals],
                ['How did you hear about us?', application.hear_about_us],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          {documents && documents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Documents</h2>
              <div className="space-y-2">
                {documents.map((doc: { id: number; file_name: string; document_type: string; file_size: number }) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">{doc.document_type} &middot; {(doc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {application.status === 'rejected' && application.rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
              <h2 className="font-semibold text-red-800 dark:text-red-300 mb-2">Rejection Reason</h2>
              <p className="text-red-700 dark:text-red-400">{application.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
