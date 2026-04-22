/**
 * Remembers scroll position per feed type so navigating back from post detail
 * lands the user at the same spot instead of the top.
 */
import { create } from 'zustand'
import type { UnifiedFeedType } from '../hooks/useFeedByType'

interface FeedScrollState {
  positions: Record<UnifiedFeedType, number>
  save: (feedType: UnifiedFeedType, top: number) => void
  clear: (feedType: UnifiedFeedType) => void
}

export const useFeedScrollStore = create<FeedScrollState>((set) => ({
  positions: { snaps: 0, threads: 0, waves: 0, moments: 0 },
  save: (feedType, top) =>
    set((s) => ({ positions: { ...s.positions, [feedType]: top } })),
  clear: (feedType) =>
    set((s) => ({ positions: { ...s.positions, [feedType]: 0 } })),
}))
