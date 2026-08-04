'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { GraduationCap, Menu, X } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Public Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LMS Platform</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
              <Link href="/#courses" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Courses</Link>
              <Link href="/#categories" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Categories</Link>
              <Link href="/#pricing" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/#contact" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Contact</Link>
              <Link href="/apply/teacher" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Apply as Teacher</Link>
              <Link href="/apply/student" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Apply as Student</Link>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href={`/${user?.role === 'public_user' ? 'public-user' : user?.role || 'login'}`} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Login</Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all">Register</Link>
                </>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Home</Link>
              <Link href="/#courses" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Courses</Link>
              <Link href="/#categories" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Categories</Link>
              <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Pricing</Link>
              <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Contact</Link>
              <Link href="/apply/teacher" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50">Apply as Teacher</Link>
              <Link href="/apply/student" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50">Apply as Student</Link>
            </div>
          </div>
        )}
      </nav>
      {children}
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">LMS Platform</span>
              </div>
              <p className="text-sm">Empowering learners and educators worldwide with cutting-edge technology.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Platform</h3>
              <div className="space-y-2 text-sm">
                <Link href="/#courses" className="block hover:text-white transition-colors">Browse Courses</Link>
                <Link href="/apply/teacher" className="block hover:text-white transition-colors">Apply as Teacher</Link>
                <Link href="/apply/student" className="block hover:text-white transition-colors">Apply as Student</Link>
                <Link href="/#pricing" className="block hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Company</h3>
              <div className="space-y-2 text-sm">
                <Link href="/#about" className="block hover:text-white transition-colors">About Us</Link>
                <Link href="/#contact" className="block hover:text-white transition-colors">Contact</Link>
                <Link href="#" className="block hover:text-white transition-colors">Careers</Link>
                <Link href="#" className="block hover:text-white transition-colors">Blog</Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Support</h3>
              <div className="space-y-2 text-sm">
                <Link href="#" className="block hover:text-white transition-colors">Help Center</Link>
                <Link href="#" className="block hover:text-white transition-colors">Terms of Service</Link>
                <Link href="#" className="block hover:text-white transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2026 LMS Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
