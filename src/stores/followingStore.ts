/**
 * Store for logged-in user's following list (condenser_api.get_following).
 * Used to filter "Following" feed in Snaps, Ecency, Threads, Liketu.
 */
import { create } from 'zustand'
import { getFollowing } from '../services/hiveService'

interface FollowingState {
  /** Set of usernames the current user follows (blog). Empty when not loaded or not logged in. */
  followingSet: Set<string>
  loading: boolean
  error: string | null
  /** Last username we fetched followings for (to avoid refetch when switching filters) */
  lastFetchedFor: string | null
  fetchFollowings: (username: string, signal?: AbortSignal) => Promise<void>
  isFollowing: (username: string) => boolean
  reset: () => void
}

const initialState = {
  followingSet: new Set<string>(),
  loading: false,
  error: null as string | null,
  lastFetchedFor: null as string | null,
}

export const useFollowingStore = create<FollowingState>((set, get) => ({
  ...initialState,

  fetchFollowings: async (username: string, signal?: AbortSignal) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      set({ followingSet: new Set(), lastFetchedFor: null })
      return
    }
    if (get().lastFetchedFor === trimmed) return
    set({ loading: true, error: null })
    try {
      const result = await getFollowing(trimmed, '', 'blog', 1000, signal)
      const followingSet = new Set<string>(result.map((r) => r.following.toLowerCase()))
      set({ followingSet, lastFetchedFor: trimmed, loading: false })
    } catch (e) {
      if (signal?.aborted) return
      set({
        error: e instanceof Error ? e.message : 'Failed to load followings',
        loading: false,
        lastFetchedFor: null,
      })
    }
  },

  isFollowing: (username: string) => {
    return get().followingSet.has(username.toLowerCase())
  },

  reset: () => set(initialState),
}))
