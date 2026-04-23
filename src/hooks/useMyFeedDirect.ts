/**
 * Fetches the current user's own posts for the selected feed type directly
 * from the hreplier endpoint (`?author=<me>&parent=<container>`), paginated
 * client-side at 10 posts per page. Used when the "My Feed" filter is
 * active; disabled otherwise.
 *
 * `loadMore()` is wired to the feed's IntersectionObserver / "Load more"
 * button in the feed UI.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMyFeedPosts, MY_FEED_PAGE_SIZE } from '../services/hiveService'
import type { FeedType, NormalizedPost } from '../utils/types'

interface MyFeedDirectState {
  posts: NormalizedPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
}

const IDLE: MyFeedDirectState = {
  posts: [],
  loading: false,
  error: null,
  hasMore: false,
  loadMore: async () => { /* idle */ },
}

export function useMyFeedDirect(
  feedType: FeedType,
  username: string,
  enabled: boolean,
): MyFeedDirectState {
  const [state, setState] = useState<MyFeedDirectState>(IDLE)
  // Track the next offset to fetch on loadMore without coupling it to render state.
  const nextOffsetRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const inputsKey = enabled && username ? `${feedType}|${username}` : ''

  const loadMore = useCallback(async () => {
    if (!enabled || !username) return
    // Guard against concurrent calls — read latest state via setState updater.
    let shouldFetch = false
    setState((s) => {
      if (s.loading || !s.hasMore) return s
      shouldFetch = true
      return { ...s, loading: true, error: null }
    })
    if (!shouldFetch) return

    const ctl = new AbortController()
    abortRef.current = ctl
    try {
      const { posts: newPosts, hasMore, nextOffset } = await fetchMyFeedPosts(
        feedType,
        username,
        nextOffsetRef.current,
        MY_FEED_PAGE_SIZE,
        username,
        ctl.signal,
      )
      if (ctl.signal.aborted) return
      nextOffsetRef.current = nextOffset
      setState((s) => ({
        ...s,
        posts: [...s.posts, ...newPosts],
        loading: false,
        hasMore,
      }))
    } catch (e) {
      if (ctl.signal.aborted) return
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load my feed',
      }))
    }
  }, [feedType, username, enabled])

  // Initial fetch when the filter turns on / the (feedType, user) pair changes.
  useEffect(() => {
    abortRef.current?.abort('my-feed-inputs-changed')
    nextOffsetRef.current = 0
    if (!enabled || !username) {
      setState(IDLE)
      return
    }

    const ctl = new AbortController()
    abortRef.current = ctl
    setState({ posts: [], loading: true, error: null, hasMore: true, loadMore })

    fetchMyFeedPosts(feedType, username, 0, MY_FEED_PAGE_SIZE, username, ctl.signal)
      .then(({ posts, hasMore, nextOffset }) => {
        if (ctl.signal.aborted) return
        nextOffsetRef.current = nextOffset
        setState({ posts, loading: false, error: null, hasMore, loadMore })
      })
      .catch((e: unknown) => {
        if (ctl.signal.aborted) return
        setState({
          posts: [],
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load my feed',
          hasMore: false,
          loadMore,
        })
      })

    return () => ctl.abort('my-feed-unmount')
    // loadMore is stable per (feedType, username, enabled) — use inputsKey as the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsKey])

  // Keep the latest `loadMore` reference in the returned state object so callers
  // that memoise it get a fresh closure when inputs change.
  return { ...state, loadMore }
}
