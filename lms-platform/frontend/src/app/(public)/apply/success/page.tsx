'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'application'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted Successfully</h1>
          <p className="text-gray-500 mb-4">Thank you for applying.</p>
          <p className="text-gray-500 mb-6">Your {type} application has been submitted successfully.</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">Please wait while the Admin reviews your application. You will receive a notification after review.</p>
          </div>
          <div className="space-y-3">
            <Link href="/public-user/applications" className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              View My Applications <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/public-user" className="block text-sm text-gray-500 hover:text-blue-600 transition-colors">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <SuccessContent />
    </Suspense>
  )
}
