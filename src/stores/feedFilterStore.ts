/**
 * Store for header feed filter: Newest, Trending, Following (logged-in only), My feed (logged-in only).
 * When not logged in, only Newest and Trending are available.
 */
import { create } from 'zustand'

export type FeedFilterMode = 'newest' | 'trending' | 'following' | 'my_feed'

interface FeedFilterState {
  feedFilter: FeedFilterMode
  setFeedFilter: (mode: FeedFilterMode) => void
}

export const useFeedFilterStore = create<FeedFilterState>((set) => ({
  feedFilter: 'newest',
  setFeedFilter: (feedFilter) => set({ feedFilter }),
}))
