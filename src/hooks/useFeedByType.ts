import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { useReputationStore, checkLowReputation } from '../stores/reputationStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useFeedFilterStore } from '../stores/feedFilterStore'
import { useFollowingStore } from '../stores/followingStore'
import { useAuthData } from '../stores/authStore'
import type { NormalizedPost } from '../utils/types'

export type UnifiedFeedType = 'snaps' | 'threads' | 'waves' | 'moments'

const FETCH_BY_TYPE = {
  snaps: () => useSnapsStore.getState().fetchFeed(),
  threads: () => useThreadsStore.getState().fetchFeed(),
  waves: () => useWavesStore.getState().fetchFeed(),
  moments: () => useMomentStore.getState().fetchFeed(),
} as const

const feedSliceSelector = (s: {
  posts: NormalizedPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
}) => ({
  posts: s.posts,
  loading: s.loading,
  error: s.error,
  hasMore: s.hasMore,
  loadMore: s.loadMore,
})

/** Returns feed state for a given feed type (snaps, threads, waves, moments). Use in unified feed only. */
export function useFeedByType(feedType: UnifiedFeedType) {
  const snaps = useSnapsStore(useShallow(feedSliceSelector))
  const threads = useThreadsStore(useShallow(feedSliceSelector))
  const waves = useWavesStore(useShallow(feedSliceSelector))
  const moments = useMomentStore(useShallow(feedSliceSelector))

  const state =
    feedType === 'snaps'
      ? snaps
      : feedType === 'threads'
        ? threads
        : feedType === 'waves'
          ? waves
          : moments

  const repCache = useReputationStore((s) => s.cache)
  const isIgnored = useIgnoredAuthorsStore((s) => s.isIgnored)
  const feedFilter = useFeedFilterStore((s) => s.feedFilter)
  const isFollowing = useFollowingStore((s) => s.isFollowing)
  const username = useAuthData().username ?? ''

  let filteredPosts = state.posts.filter(
    (p) => !checkLowReputation(repCache, p.author) && !isIgnored(p.author)
  )

  switch (feedFilter) {
    case 'trending':
      filteredPosts = [...filteredPosts].sort(
        (a, b) => (b.children ?? 0) - (a.children ?? 0) || new Date(b.created).getTime() - new Date(a.created).getTime()
      )
      break
    case 'following':
      filteredPosts = filteredPosts.filter((p) => isFollowing(p.author))
      break
    case 'my_feed':
      if (username) {
        const lower = username.toLowerCase()
        filteredPosts = filteredPosts.filter((p) => p.author.toLowerCase() === lower)
      }
      break
    case 'newest':
    default:
      break
  }

  useEffect(() => {
    FETCH_BY_TYPE[feedType]()
  }, [feedType])

  return {
    ...state,
    posts: filteredPosts,
  }
}
