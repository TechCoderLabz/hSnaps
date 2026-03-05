/**
 * Zustand store for reblog status.
 * On-demand checking: only checks when user clicks the reblog button.
 * Caches results so repeated clicks don't re-fetch.
 */
import { create } from 'zustand'
import { getRebloggedBy } from '../services/hiveService'

interface ReblogState {
  /** Map of "author/permlink" → Set of usernames who reblogged */
  cache: Record<string, string[]>
  /** Current username for filtering */
  _username: string | null

  /** Set the current username */
  setUsername: (username: string | null) => void
  /** Check if the current user has reblogged a post (from cache) */
  isReblogged: (author: string, permlink: string) => boolean
  /** On-demand check: fetch reblog status for a single post, returns whether user has reblogged */
  checkReblog: (author: string, permlink: string) => Promise<boolean>
  /** Mark a post as reblogged/unreblogged locally (optimistic update) */
  setReblogged: (author: string, permlink: string, reblogged: boolean) => void
}

export const useReblogStore = create<ReblogState>((set, get) => ({
  cache: {},
  _username: null,

  setUsername: (username) => set({ _username: username }),

  isReblogged: (author, permlink) => {
    const key = `${author}/${permlink}`
    const cached = get().cache[key]
    const username = get()._username
    if (!cached || !username) return false
    return cached.some((a) => a.toLowerCase() === username.toLowerCase())
  },

  checkReblog: async (author, permlink) => {
    const key = `${author}/${permlink}`
    const state = get()

    // Return cached result if available
    if (state.cache[key] !== undefined) {
      const username = state._username
      if (!username) return false
      return state.cache[key].some((a) => a.toLowerCase() === username.toLowerCase())
    }

    // Fetch from API
    try {
      const rebloggedBy = await getRebloggedBy(author, permlink)
      set((s) => ({ cache: { ...s.cache, [key]: rebloggedBy } }))
      const username = get()._username
      if (!username) return false
      return rebloggedBy.some((a) => a.toLowerCase() === username.toLowerCase())
    } catch {
      set((s) => ({ cache: { ...s.cache, [key]: s.cache[key] ?? [] } }))
      return false
    }
  },

  setReblogged: (author, permlink, reblogged) => {
    const key = `${author}/${permlink}`
    const username = get()._username
    if (!username) return
    set((s) => {
      const current = s.cache[key] ?? []
      const userLower = username.toLowerCase()
      let next: string[]
      if (reblogged) {
        if (current.some((a) => a.toLowerCase() === userLower)) return { cache: s.cache }
        next = [...current, username]
      } else {
        next = current.filter((a) => a.toLowerCase() !== userLower)
      }
      return { cache: { ...s.cache, [key]: next } }
    })
  },
}))
