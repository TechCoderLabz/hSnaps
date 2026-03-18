/**
 * Returns a human-readable label showing how far back the loaded posts span.
 * Examples: "last 3 days", "last 2 months", "last 1 year"
 */
export function getTimeRangeLabel(posts: { created: string }[]): string | null {
  if (posts.length === 0) return null
  const last = posts[posts.length - 1]
  try {
    const iso = last.created
    const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const days = Math.floor(diffMs / 86_400_000)

    if (days <= 0) return 'today'
    if (days === 1) return 'last 1 day'

    // Years (365+ days)
    const years = Math.floor(days / 365)
    if (years >= 1) {
      return `last ${years} year${years === 1 ? '' : 's'}`
    }

    // Months (30+ days)
    const months = Math.floor(days / 30)
    if (months >= 1) {
      return `last ${months} month${months === 1 ? '' : 's'}`
    }

    // Days
    return `last ${days} day${days === 1 ? '' : 's'}`
  } catch {
    return null
  }
}
