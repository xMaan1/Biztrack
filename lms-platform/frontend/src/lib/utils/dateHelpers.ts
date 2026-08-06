export function formatDuration(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return null

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (end <= start) return null

  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  const diffYears = Math.floor(diffMonths / 12)

  if (diffYears >= 1) {
    const remainingMonths = diffMonths % 12
    if (remainingMonths > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
    }
    return `${diffYears} year${diffYears > 1 ? 's' : ''}`
  }

  if (diffMonths >= 1) {
    const remainingWeeks = Math.floor((diffDays - diffMonths * 30) / 7)
    if (remainingWeeks > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ${remainingWeeks} week${remainingWeeks > 1 ? 's' : ''}`
    }
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`
  }

  if (diffWeeks >= 1) {
    const remainingDays = diffDays % 7
    if (remainingDays > 0) {
      return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
    }
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`
  }

  return `${diffDays} day${diffDays > 1 ? 's' : ''}`
}
