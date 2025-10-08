export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'active':
    case 'published':
      return 'success';
    case 'in_progress':
    case 'in-progress':
    case 'processing':
      return 'info';
    case 'on_hold':
    case 'on-hold':
    case 'pending':
    case 'waiting':
      return 'warning';
    case 'cancelled':
    case 'error':
    case 'failed':
    case 'rejected':
      return 'destructive';
    case 'planning':
    case 'draft':
    case 'inactive':
    case 'archived':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'critical':
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
    case 'normal':
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
    case 'processing':
      return '▶';
    case 'on_hold':
    case 'on-hold':
    case 'pending':
    case 'waiting':
      return '⏸';
    case 'cancelled':
    case 'error':
    case 'failed':
    case 'rejected':
      return '✗';
    case 'planning':
    case 'draft':
      return '📝';
    case 'inactive':
    case 'archived':
      return '📁';
    default:
      return '•';
  }
}

export function getPriorityIcon(priority: string) {
  switch (priority.toLowerCase()) {
    case 'critical':
    case 'urgent':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
    case 'normal':
      return '🔵';
    case 'low':
      return '🟢';
    default:
      return '⚪';
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
    case 'delivery':
      return '🚚';
    case 'pickup':
      return '📤';
    case 'transfer':
      return '↔️';
    case 'adjustment':
      return '⚖️';
    default:
      return '📋';
  }
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'active':
    case 'published':
      return 'default';
    case 'in_progress':
    case 'in-progress':
    case 'processing':
      return 'default';
    case 'on_hold':
    case 'on-hold':
    case 'pending':
    case 'waiting':
      return 'secondary';
    case 'cancelled':
    case 'error':
    case 'failed':
    case 'rejected':
      return 'destructive';
    case 'planning':
    case 'draft':
    case 'inactive':
    case 'archived':
      return 'outline';
    default:
      return 'outline';
  }
}
