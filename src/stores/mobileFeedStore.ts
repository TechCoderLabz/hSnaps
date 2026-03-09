/**
 * Current feed type for single-column (mobile) view.
 * Shared between AppHeader (feed switcher in app bar) and UnifiedFeedPage.
 */
import { create } from 'zustand'
import type { UnifiedFeedType } from '../hooks/useFeedByType'

interface MobileFeedState {
  feedType: UnifiedFeedType
  setFeedType: (feedType: UnifiedFeedType) => void
}

export const useMobileFeedStore = create<MobileFeedState>((set) => ({
  feedType: 'snaps',
  setFeedType: (feedType) => set({ feedType }),
}))
