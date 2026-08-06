'use client'

import { Eye, Trash2 } from 'lucide-react'

interface UserTableUser {
  id: number
  email: string
  role?: string | null
  department_name?: string | null
  is_active: boolean
  profile?: { first_name?: string; last_name?: string } | null
}

interface UserTableProps {
  users: UserTableUser[]
  loading?: boolean
  onView?: (user: UserTableUser) => void
  onDelete?: (user: UserTableUser) => void
}

function getName(u: UserTableUser): string {
  return u.profile ? `${u.profile.first_name || ''} ${u.profile.last_name || ''}`.trim() || u.email : u.email
}

function getRoleColor(role: string | null | undefined): string {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  }
  return colors[role || ''] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

export function UserTable({ users, loading, onView, onDelete }: UserTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">Loading...</div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">No users found.</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {getName(user).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{getName(user)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>{user.role}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{user.department_name || '—'}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>{user.is_active ? 'Active' : 'Inactive'}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {onView && (
                    <button onClick={() => onView(user)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="View">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(user)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
