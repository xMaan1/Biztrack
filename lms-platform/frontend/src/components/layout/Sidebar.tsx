'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  Calendar,
  ClipboardList,
  GraduationCap,
  Settings,
  LogOut,
  ChevronRight,
  BarChart3,
  FileText,
  Clock,
  UserCheck,
  Award,
  FolderOpen,
  HelpCircle,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'

interface SidebarProps {
  userRole: string
  onClose?: () => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  active?: boolean
  subItems?: NavItem[]
}

export function Sidebar({ userRole, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  // Navigation items based on role
  const getNavItems = (): NavItem[] => {
    const commonItems: NavItem[] = [
      {
        title: 'Dashboard',
        href: `/${userRole}`,
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: <Bell className="w-5 h-5" />,
      },
    ]

    const roleSpecificItems: Record<string, NavItem[]> = {
      admin: [
        {
          title: 'Users',
          href: '/admin/users',
          icon: <Users className="w-5 h-5" />,
          subItems: [
            { title: 'All Users', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
            { title: 'Students', href: '/admin/students', icon: <GraduationCap className="w-4 h-4" /> },
            { title: 'Teachers', href: '/admin/teachers', icon: <BookOpen className="w-4 h-4" /> },
            { title: 'Administrators', href: '/admin/admins', icon: <Settings className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Courses',
          href: '/admin/courses',
          icon: <BookOpen className="w-5 h-5" />,
          subItems: [
            { title: 'All Courses', href: '/admin/courses', icon: <FolderOpen className="w-4 h-4" /> },
            { title: 'Create Course', href: '/admin/courses/create', icon: <BookOpen className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Departments',
          href: '/admin/departments',
          icon: <GraduationCap className="w-5 h-5" />,
        },
        {
          title: 'Reports',
          href: '/admin/reports',
          icon: <BarChart3 className="w-5 h-5" />,
          subItems: [
            { title: 'Enrollment Report', href: '/admin/reports/enrollment', icon: <Users className="w-4 h-4" /> },
            { title: 'Attendance Report', href: '/admin/reports/attendance', icon: <UserCheck className="w-4 h-4" /> },
            { title: 'Grade Report', href: '/admin/reports/grades', icon: <Award className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Applications',
          href: '/admin/applications',
          icon: <FileText className="w-5 h-5" />,
          subItems: [
            { title: 'Overview', href: '/admin/applications', icon: <BarChart3 className="w-4 h-4" /> },
            { title: 'Teacher Applications', href: '/admin/applications/teachers', icon: <BookOpen className="w-4 h-4" /> },
            { title: 'Student Applications', href: '/admin/applications/students', icon: <GraduationCap className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Settings',
          href: '/admin/settings',
          icon: <Settings className="w-5 h-5" />,
        },
      ],
      teacher: [
        {
          title: 'My Courses',
          href: '/teacher/courses',
          icon: <BookOpen className="w-5 h-5" />,
        },
        {
          title: 'Lectures',
          href: '/teacher/lectures',
          icon: <Video className="w-5 h-5" />,
        },
        {
          title: 'Attendance',
          href: '/teacher/attendance',
          icon: <UserCheck className="w-5 h-5" />,
          subItems: [
            { title: 'Mark Attendance', href: '/teacher/attendance/mark', icon: <Clock className="w-4 h-4" /> },
            { title: 'QR Code', href: '/teacher/attendance/qr', icon: <Calendar className="w-4 h-4" /> },
            { title: 'Reports', href: '/teacher/attendance/reports', icon: <FileText className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Assignments',
          href: '/teacher/assignments',
          icon: <ClipboardList className="w-5 h-5" />,
          subItems: [
            { title: 'All Assignments', href: '/teacher/assignments', icon: <ClipboardList className="w-4 h-4" /> },
            { title: 'Grade Submissions', href: '/teacher/assignments/grade', icon: <Award className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Gradebook',
          href: '/teacher/gradebook',
          icon: <Award className="w-5 h-5" />,
        },
      ],
      public_user: [
        {
          title: 'Browse Courses',
          href: '/public-user/courses',
          icon: <BookOpen className="w-5 h-5" />,
        },
        {
          title: 'Apply as Teacher',
          href: '/apply/teacher',
          icon: <BookOpen className="w-5 h-5" />,
        },
        {
          title: 'Apply as Student',
          href: '/apply/student',
          icon: <GraduationCap className="w-5 h-5" />,
        },
        {
          title: 'My Applications',
          href: '/public-user/applications',
          icon: <FileText className="w-5 h-5" />,
        },
      ],
      student: [
        {
          title: 'Courses',
          href: '/student/my-courses',
          icon: <BookOpen className="w-5 h-5" />,
          subItems: [
            { title: 'My Courses', href: '/student/my-courses', icon: <BookOpen className="w-4 h-4" /> },
            { title: 'New Courses', href: '/student/courses', icon: <GraduationCap className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Live Sessions',
          href: '/student/live-sessions',
          icon: <Video className="w-5 h-5" />,
        },
        {
          title: 'Assignments',
          href: '/student/assignments',
          icon: <ClipboardList className="w-5 h-5" />,
          subItems: [
            { title: 'Pending', href: '/student/assignments/pending', icon: <Clock className="w-4 h-4" /> },
            { title: 'Submitted', href: '/student/assignments/submitted', icon: <FileText className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Attendance',
          href: '/student/attendance',
          icon: <UserCheck className="w-5 h-5" />,
          subItems: [
            { title: 'My Attendance', href: '/student/attendance', icon: <Calendar className="w-4 h-4" /> },
            { title: 'QR Scan', href: '/student/attendance/qr-scan', icon: <Clock className="w-4 h-4" /> },
          ]
        },
        {
          title: 'Grades',
          href: '/student/grades',
          icon: <Award className="w-5 h-5" />,
        },
        {
          title: 'Progress',
          href: '/student/progress',
          icon: <BarChart3 className="w-5 h-5" />,
        },
      ],
    }

    return [...commonItems, ...(roleSpecificItems[userRole] || [])]
  }

  const navItems = getNavItems()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">LMS</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Platform</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <div key={item.href}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedItems.includes(item.title) && 'rotate-90'
                      )}
                    />
                  </button>
                  {expandedItems.includes(item.title) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                            pathname === subItem.href
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          {subItem.icon}
                          <span>{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <button
          onClick={() => {
            // Open help/FAQ
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Help & Support</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}