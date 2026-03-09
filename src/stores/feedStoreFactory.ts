/**
 * Feed stores (snaps, threads, waves, moments) using bridge APIs.
 * get_account_posts → get_discussion per container (replies = posts).
 */
import { create } from 'zustand'
import type { NormalizedPost } from '../utils/types'
import { fetchFeedPage } from '../services/hiveService'
import type { FeedType } from '../utils/types'
import { useAppAuthStore } from './authStore'

export interface FeedState {
  posts: NormalizedPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  fetchFeed: () => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
}

const initialState = {
  posts: [] as NormalizedPost[],
  loading: false,
  error: null as string | null,
  hasMore: true,
  page: 1,
}

export function createFeedStore(feedType: FeedType) {
  return create<FeedState>((set, get) => ({
    ...initialState,
    fetchFeed: async () => {
      set({ loading: true, error: null, page: 1 })
      const observer = useAppAuthStore.getState().username ?? ''
      try {
        const { posts, hasMore } = await fetchFeedPage(feedType, 1, observer)
        set({
          posts,
          hasMore,
          page: 1,
          loading: false,
          error: null,
        })
      } catch (e) {
        set({
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to fetch',
        })
      }
    },
    loadMore: async () => {
      const { page, loading, hasMore } = get()
      if (loading || !hasMore) return
      set({ loading: true })
      const observer = useAppAuthStore.getState().username ?? ''
      const nextPage = page + 1
      try {
        const { posts: newPosts, hasMore: more } = await fetchFeedPage(
          feedType,
          nextPage,
          observer
        )
        set((s) => ({
          posts: [...s.posts, ...newPosts],
          page: nextPage,
          hasMore: more,
          loading: false,
        }))
      } catch (e) {
        set({
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load more',
        })
      }
    },
    reset: () => set(initialState),
  }))
}
