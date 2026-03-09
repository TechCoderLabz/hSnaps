/**
 * PeakD public API: trending tags, authors, communities.
 * In dev we use Vite proxy (/api/peakd) to avoid CORS; in production use PeakD directly (or your own backend proxy).
 */
const PEAKD_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? '/api/peakd'
    : 'https://peakd.com/api/public/snaps'

export interface TrendingTag {
  tag: string
  posts: number
}

export interface TrendingAuthor {
  author: string
  posts: number
}

export interface TrendingCommunity {
  tag: string
  posts: number
}

/** GET trending/tags?container=peak.snaps */
export async function getTrendingTags(container: string, signal?: AbortSignal): Promise<TrendingTag[]> {
  const url = `${PEAKD_BASE}/trending/tags?container=${encodeURIComponent(container)}`
  const res = await fetch(url, {
    headers: { accept: 'application/json, text/plain, */*' },
    signal,
  })
  if (!res.ok) throw new Error('PeakD tags error')
  const data = (await res.json()) as TrendingTag[]
  return Array.isArray(data) ? data : []
}

/** GET trending/authors?container=peak.snaps */
export async function getTrendingAuthors(container: string, signal?: AbortSignal): Promise<TrendingAuthor[]> {
  const url = `${PEAKD_BASE}/trending/authors?container=${encodeURIComponent(container)}`
  const res = await fetch(url, {
    headers: { accept: 'application/json, text/plain, */*' },
    signal,
  })
  if (!res.ok) throw new Error('PeakD authors error')
  const data = (await res.json()) as TrendingAuthor[]
  return Array.isArray(data) ? data : []
}

/** GET trending/communities?container=peak.snaps */
export async function getTrendingCommunities(container: string, signal?: AbortSignal): Promise<TrendingCommunity[]> {
  const url = `${PEAKD_BASE}/trending/communities?container=${encodeURIComponent(container)}`
  const res = await fetch(url, {
    headers: { accept: 'application/json, text/plain, */*' },
    signal,
  })
  if (!res.ok) throw new Error('PeakD communities error')
  const data = (await res.json()) as TrendingCommunity[]
  return Array.isArray(data) ? data : []
}
