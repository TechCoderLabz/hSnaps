import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { useBlacklistStore, isBlacklisted } from '../stores/blacklistStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useFeedFilterStore } from '../stores/feedFilterStore'
import { useFollowingStore } from '../stores/followingStore'
import { useAuthData } from '../stores/authStore'
import type { NormalizedPost } from '../utils/types'

export type UnifiedFeedType = 'snaps' | 'threads' | 'waves' | 'moments'

const FETCH_BY_TYPE = {
  snaps: (signal?: AbortSignal) => useSnapsStore.getState().fetchFeed(signal),
  threads: (signal?: AbortSignal) => useThreadsStore.getState().fetchFeed(signal),
  waves: (signal?: AbortSignal) => useWavesStore.getState().fetchFeed(signal),
  moments: (signal?: AbortSignal) => useMomentStore.getState().fetchFeed(signal),
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

  const blacklist = useBlacklistStore((s) => s.set)
  const isIgnored = useIgnoredAuthorsStore((s) => s.isIgnored)
  const feedFilter = useFeedFilterStore((s) => s.feedFilter)
  const isFollowing = useFollowingStore((s) => s.isFollowing)
  const username = useAuthData().username ?? ''

  let filteredPosts = state.posts.filter(
    (p) => !isBlacklisted(blacklist, p.author) && !isIgnored(p.author)
  )

  switch (feedFilter) {
    case 'trending':
      filteredPosts = [...filteredPosts].sort(
        (a, b) => (b.children ?? 0) - (a.children ?? 0) || new Date(b.created).getTime() - new Date(a.created).getTime()
      )
      break
    case 'hsnaps':
      filteredPosts = filteredPosts.filter((p) => {
        if (!p.json_metadata) return false
        try {
          const meta = JSON.parse(p.json_metadata) as { tags?: string[] }
          return Array.isArray(meta.tags) && meta.tags.some((t) => String(t).toLowerCase() === 'hsnaps')
        } catch { return false }
      })
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
    const abortController = new AbortController()
    FETCH_BY_TYPE[feedType](abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [feedType])

  // Auto-load more containers for "My Feed" until we cover the last 15 days (snaps only)
  useEffect(() => {
    if (feedType !== 'snaps') return
    if (feedFilter !== 'my_feed' || !username) return
    if (state.loading || !state.hasMore) return

    const fifteenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (state.posts.length > 0) {
      const oldestTime = Math.min(...state.posts.map((p) => new Date(p.created).getTime()))
      if (oldestTime < fifteenDaysAgo) return
    }

    state.loadMore()
  }, [feedType, feedFilter, username, state.loading, state.hasMore, state.posts.length])

  return {
    ...state,
    posts: filteredPosts,
    /** Unfiltered store posts (before my_feed/following filter). Use for time-range labels. */
    allPosts: state.posts,
  }
}

/** Imperatively refresh a feed by type (for pull-to-refresh / reload button). */
export function refreshFeed(feedType: UnifiedFeedType): Promise<void> {
  return FETCH_BY_TYPE[feedType]()
}
