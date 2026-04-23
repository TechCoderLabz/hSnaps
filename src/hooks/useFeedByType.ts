import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { useBlacklistStore, isBlacklisted } from '../stores/blacklistStore'
import { useAbusiveUsersStore, isAbusive } from '../stores/abusiveUsersStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useFeedFilterStore } from '../stores/feedFilterStore'
import { useFollowingStore } from '../stores/followingStore'
import { useAuthData } from '../stores/authStore'
import { useMyFeedDirect } from './useMyFeedDirect'
import type { NormalizedPost } from '../utils/types'

export type UnifiedFeedType = 'snaps' | 'threads' | 'waves' | 'moments'

const FETCH_BY_TYPE = {
  snaps: (signal?: AbortSignal) => useSnapsStore.getState().fetchFeed(signal),
  threads: (signal?: AbortSignal) => useThreadsStore.getState().fetchFeed(signal),
  waves: (signal?: AbortSignal) => useWavesStore.getState().fetchFeed(signal),
  moments: (signal?: AbortSignal) => useMomentStore.getState().fetchFeed(signal),
} as const

const GET_STATE_BY_TYPE = {
  snaps: () => useSnapsStore.getState(),
  threads: () => useThreadsStore.getState(),
  waves: () => useWavesStore.getState(),
  moments: () => useMomentStore.getState(),
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
  const abusive = useAbusiveUsersStore((s) => s.set)
  const isIgnored = useIgnoredAuthorsStore((s) => s.isIgnored)
  const feedFilter = useFeedFilterStore((s) => s.feedFilter)
  const isFollowing = useFollowingStore((s) => s.isFollowing)
  const username = useAuthData().username ?? ''

  // "My Feed" pulls from hreplier directly — one API round-trip instead of
  // paginating through the container feed just to filter by one author.
  // The hook is a no-op when the filter isn't selected.
  const myFeedDirect = useMyFeedDirect(feedType, username, feedFilter === 'my_feed')

  let filteredPosts = state.posts.filter(
    (p) => !isBlacklisted(blacklist, p.author) && !isAbusive(abusive, p.author) && !isIgnored(p.author)
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
      // Posts come from the direct fetcher; still apply moderation filters so
      // self-blacklisted / ignored accounts respect those lists.
      filteredPosts = myFeedDirect.posts.filter(
        (p) => !isBlacklisted(blacklist, p.author) && !isAbusive(abusive, p.author) && !isIgnored(p.author),
      )
      break
    case 'newest':
    default:
      break
  }

  useEffect(() => {
    // Don't re-fetch on remount when the store already has data: that would
    // reset pagination back to page 1 and cause a flicker when returning from
    // post detail or after an upvote/comment. Use refreshFeed() for explicit
    // refresh (pull-to-refresh, refresh button, logout).
    if (GET_STATE_BY_TYPE[feedType]().posts.length > 0) return
    const abortController = new AbortController()
    FETCH_BY_TYPE[feedType](abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [feedType])

  // My Feed uses its own direct fetcher — surface its loading / error /
  // hasMore so the feed's scroll-end trigger can keep paging at 10/page.
  if (feedFilter === 'my_feed') {
    return {
      posts: filteredPosts,
      loading: myFeedDirect.loading,
      error: myFeedDirect.error,
      hasMore: myFeedDirect.hasMore,
      loadMore: myFeedDirect.loadMore,
      allPosts: state.posts,
    }
  }

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
