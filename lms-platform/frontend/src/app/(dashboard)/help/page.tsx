'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, HelpCircle, BookOpen, MessageCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const faqs = [
    { q: 'How do I reset my password?', a: 'Go to Settings > Change Password to update your password.' },
    { q: 'How do I update my profile?', a: 'Click on your avatar in the top-right corner and select Profile.' },
    { q: 'How do I contact support?', a: 'Email us at support@lms.com or use the contact form below.' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get help with the LMS platform</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
              <p className="font-medium text-gray-900 dark:text-white">{faq.q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Contact Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you need further assistance, please contact our support team:
          </p>
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-700 dark:text-gray-300">
            <Mail className="w-4 h-4" />
            <a href="mailto:support@lms.com" className="text-primary hover:underline">support@lms.com</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
