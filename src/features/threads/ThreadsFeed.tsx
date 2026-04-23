import { useEffect } from 'react'
import Masonry from 'react-masonry-css'
import { useThreadsStore } from '../../stores/threadsStore'
import { useAuthData } from '../../stores/authStore'
import { useBlacklistStore, isBlacklisted } from '../../stores/blacklistStore'
import { useAbusiveUsersStore, isAbusive } from '../../stores/abusiveUsersStore'
import { useIgnoredAuthorsStore } from '../../stores/ignoredAuthorsStore'
import { useViewStore } from '../../stores/viewStore'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { PostCard } from '../../components/PostCard'
import { ComposeFab } from '../../components/ComposeFab'
import { FeedSkeleton } from '../../components/FeedSkeleton'
import { EmptyState } from '../../components/EmptyState'
import { FEED_AVATARS } from '../../constants/feeds'
import { getTimeRangeLabel } from '../../utils/feedTimeLabel'

const MASONRY_BP = { default: 5, 1919: 4, 1279: 3, 1023: 2, 639: 1 }

export function ThreadsFeed() {
  const { isAuthenticated } = useAuthData()
  const { posts, loading, error, hasMore, fetchFeed, loadMore } = useThreadsStore()
  const blacklist = useBlacklistStore((s) => s.set)
  const abusive = useAbusiveUsersStore((s) => s.set)
  const viewMode = useViewStore((s) => s.viewMode)
  const isDesktop = useIsDesktop()
  const useGrid = isDesktop && viewMode === 'grid'

  useEffect(() => {
    // Skip refetch on remount when the store already has data. Otherwise the
    // Capacitor WebView remounting the screen (background/foreground, post
    // detail → back, orientation change) resets pagination to page 1 and the
    // user loses their position. Use the explicit Refresh button for a reload.
    if (useThreadsStore.getState().posts.length > 0) return
    const abortController = new AbortController()
    fetchFeed(abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [fetchFeed])

  const isIgnored = useIgnoredAuthorsStore((s) => s.isIgnored)
  const filteredPosts = posts.filter(
    (p) => !isBlacklisted(blacklist, p.author) && !isAbusive(abusive, p.author) && !isIgnored(p.author)
  )

  const renderItems = (items: React.ReactNode) =>
    useGrid ? (
      <Masonry breakpointCols={MASONRY_BP} className="feed-grid" columnClassName="feed-grid_column">
        {items}
      </Masonry>
    ) : (
      <div className="space-y-4">{items}</div>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          <img
            src={FEED_AVATARS.threads}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-[#3a424a]"
          />
          Threads
        </h1>
      </div>
      {isAuthenticated && (
        <ComposeFab feedType="threads" placeholder="Start a thread..." />
      )}
      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {loading && filteredPosts.length === 0 ? (
        renderItems(
          [...Array(useGrid ? 10 : 3)].map((_, i) => <FeedSkeleton key={i} />)
        )
      ) : filteredPosts.length === 0 ? (
        <EmptyState title="No threads yet" description="Start a thread." />
      ) : (
        <>
          {renderItems(
            filteredPosts.map((post) => (
              <PostCard key={`${post.author}/${post.permlink}`} post={post} readOnly={!isAuthenticated} />
            ))
          )}
          {hasMore && (
            <button
              type="button"
              onClick={() => loadMore()}
              disabled={loading}
              className="w-full rounded-xl border border-[#3a424a] bg-[#262b30] py-3 text-sm text-[#9ca3b0] transition-colors hover:bg-[#2f353d] hover:text-[#f0f0f8] disabled:opacity-50"
            >
              {loading ? 'Loading…' : (
                <>
                  Load more
                  {getTimeRangeLabel(filteredPosts) && (
                    <span className="ml-1.5 text-xs text-[#6b7280]">· {getTimeRangeLabel(filteredPosts)}</span>
                  )}
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
