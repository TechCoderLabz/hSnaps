/**
 * Feed stores (snaps, threads, waves, dbuzz, moments) using bridge APIs.
 * - Snaps/Threads/Waves/Moments: get_account_posts → get_discussion per container (replies = posts).
 * - DBuzz: get_ranked_posts with tag, paginated via nextStart.
 */
import { create } from 'zustand'
import type { NormalizedPost } from '../utils/types'
import { fetchFeedPage, type FeedPageCursor } from '../services/hiveService'
import type { FeedType } from '../utils/types'
import { useAppAuthStore } from './authStore'

export interface FeedState {
  posts: NormalizedPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  /** For DBuzz pagination (start_author/start_permlink) */
  nextStart: FeedPageCursor | null
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
  nextStart: null as FeedPageCursor | null,
}

export function createFeedStore(feedType: FeedType) {
  return create<FeedState>((set, get) => ({
    ...initialState,
    fetchFeed: async () => {
      set({ loading: true, error: null, page: 1, nextStart: null })
      const observer = useAppAuthStore.getState().username ?? ''
      try {
        const { posts, hasMore, nextStart } = await fetchFeedPage(feedType, 1, observer)
        set({
          posts,
          hasMore,
          nextStart: nextStart ?? null,
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
      const { page, loading, hasMore, nextStart } = get()
      if (loading || !hasMore) return
      set({ loading: true })
      const observer = useAppAuthStore.getState().username ?? ''
      const nextPage = page + 1
      const dbuzzStart = feedType === 'dbuzz' ? nextStart : undefined
      try {
        const { posts: newPosts, hasMore: more, nextStart: next } = await fetchFeedPage(
          feedType,
          nextPage,
          observer,
          dbuzzStart
        )
        set((s) => ({
          posts: [...s.posts, ...newPosts],
          page: nextPage,
          hasMore: more,
          nextStart: next ?? null,
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
