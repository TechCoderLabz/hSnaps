/**
 * Store for reported posts (from hreplier-api).
 * Fetches and caches the list of reported posts, with optimistic add support.
 */
import { create } from 'zustand'

const HD_API_SERVER = 'https://hreplier-api.sagarkothari88.one'

export interface ReportedPost {
  author: string
  permlink: string
}

interface ReportedPostsState {
  reportedPosts: ReportedPost[]
  state: 'idle' | 'loading' | 'failed' | 'success'
  error: string | null
  lastFetchTime: number | null
  fetchReportedPosts: (token: string, forceRefresh?: boolean) => Promise<void>
  addReportedPost: (author: string, permlink: string) => void
  reset: () => void
  isDataStale: (maxAgeMinutes?: number) => boolean
}

export const useReportedPostsStore = create<ReportedPostsState>((set, get) => ({
  reportedPosts: [],
  state: 'idle',
  error: null,
  lastFetchTime: null,

  fetchReportedPosts: async (token: string, forceRefresh = false) => {
    const current = get()
    if (!forceRefresh && current.lastFetchTime && !current.isDataStale(10)) {
      return
    }

    set({ state: 'loading', error: null })

    try {
      const res = await fetch(`${HD_API_SERVER}/reported-posts`, {
        headers: { Authorization: token },
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch reported posts: ${res.status}`)
      }

      const data = await res.json()
      const reportedPosts: ReportedPost[] = (data || []).map((p: any) => ({
        author: p.name || p.username || p.author,
        permlink: p.permlink,
      }))

      set({
        reportedPosts,
        state: 'success',
        error: null,
        lastFetchTime: Date.now(),
      })
    } catch (error) {
      console.error('Error loading reported posts:', error)
      set({
        state: 'failed',
        error: error instanceof Error ? error.message : 'Failed to load reported posts',
      })
    }
  },

  addReportedPost: (author: string, permlink: string) => {
    set((s) => ({
      reportedPosts: [...s.reportedPosts, { author, permlink }],
    }))
  },

  reset: () => set({ reportedPosts: [], state: 'idle', error: null, lastFetchTime: null }),

  isDataStale: (maxAgeMinutes = 10) => {
    const { lastFetchTime } = get()
    if (!lastFetchTime) return true
    return (Date.now() - lastFetchTime) / (1000 * 60) > maxAgeMinutes
  },
}))
