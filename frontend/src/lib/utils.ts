import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'success';
    case 'in_progress':
    case 'in-progress':
    case 'active':
      return 'info';
    case 'on_hold':
    case 'on-hold':
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'error':
    case 'failed':
      return 'destructive';
    case 'planning':
    case 'draft':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return '✓';
    case 'in_progress':
    case 'in-progress':
    case 'active':
      return '▶';
    case 'on_hold':
    case 'on-hold':
    case 'pending':
      return '⏸';
    case 'cancelled':
    case 'error':
    case 'failed':
      return '✗';
    case 'planning':
    case 'draft':
      return '📝';
    default:
      return '•';
  }
}

export function getTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'production':
      return '🏭';
    case 'maintenance':
      return '🔧';
    case 'repair':
      return '🛠️';
    case 'installation':
      return '📦';
    case 'inspection':
      return '🔍';
    default:
      return '📋';
  }
}
