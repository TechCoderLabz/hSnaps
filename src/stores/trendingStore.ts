/**
 * Trending data for the current feed: Top Tags, Top Authors, Top Communities (PeakD API).
 */
import { create } from 'zustand'
import {
  getTrendingTags,
  getTrendingAuthors,
  getTrendingCommunities,
  type TrendingTag,
  type TrendingAuthor,
  type TrendingCommunity,
} from '../services/peakdService'
import { CONTAINER_ACCOUNTS } from '../services/hiveService'
import type { FeedType } from '../utils/types'

interface TrendingState {
  tags: TrendingTag[]
  authors: TrendingAuthor[]
  communities: TrendingCommunity[]
  loading: boolean
  error: string | null
  currentFeed: FeedType | null
  fetchTrending: (feedType: FeedType) => Promise<void>
  reset: () => void
}

const initialState = {
  tags: [],
  authors: [],
  communities: [],
  loading: false,
  error: null as string | null,
  currentFeed: null as FeedType | null,
}

export const useTrendingStore = create<TrendingState>((set, get) => ({
  ...initialState,
  fetchTrending: async (feedType: FeedType) => {
    if (get().currentFeed === feedType && get().tags.length > 0) return
    const container = CONTAINER_ACCOUNTS[feedType]
    set({ loading: true, error: null, currentFeed: feedType })
    try {
      const [tags, authors, communities] = await Promise.all([
        getTrendingTags(container),
        getTrendingAuthors(container),
        getTrendingCommunities(container),
      ])
      set({
        tags,
        authors,
        communities,
        loading: false,
        error: null,
      })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load trending',
      })
    }
  },
  reset: () => set(initialState),
}))
