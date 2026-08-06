'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md">
        <div className="text-8xl md:text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">404</div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-4">Page Not Found</h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Link href="/">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
