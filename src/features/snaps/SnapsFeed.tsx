/**
 * Snaps feed: bridge.get_account_posts → bridge.get_discussion (replies = snaps).
 * FeedComposer at top when logged in; hidden for guests (read-only).
 */
import { useEffect } from 'react'
import Masonry from 'react-masonry-css'
import { useSnapsStore } from '../../stores/snapsStore'
import { useAuthData } from '../../stores/authStore'
import { useBlacklistStore, isBlacklisted } from '../../stores/blacklistStore'
import { useAbusiveUsersStore, isAbusive } from '../../stores/abusiveUsersStore'
import { useIgnoredAuthorsStore } from '../../stores/ignoredAuthorsStore'
import { DELETED_POST_BODY } from '../../utils/types'
import { useViewStore } from '../../stores/viewStore'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { PostCard } from '../../components/PostCard'
import { ComposeFab } from '../../components/ComposeFab'
import { FeedSkeleton } from '../../components/FeedSkeleton'
import { EmptyState } from '../../components/EmptyState'
import { FEED_AVATARS } from '../../constants/feeds'
import { getTimeRangeLabel } from '../../utils/feedTimeLabel'

const MASONRY_BP = { default: 5, 1919: 4, 1279: 3, 1023: 2, 639: 1 }

export function SnapsFeed() {
  const { isAuthenticated } = useAuthData()
  const { posts, loading, error, hasMore, fetchFeed, loadMore } = useSnapsStore()
  const blacklist = useBlacklistStore((s) => s.set)
  const abusive = useAbusiveUsersStore((s) => s.set)
  const isIgnored = useIgnoredAuthorsStore((s) => s.isIgnored)
  const viewMode = useViewStore((s) => s.viewMode)
  const isDesktop = useIsDesktop()
  const useGrid = isDesktop && viewMode === 'grid'

  useEffect(() => {
    const abortController = new AbortController()
    fetchFeed(abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [fetchFeed])

  const filteredPosts = posts.filter(
    (p) => !isBlacklisted(blacklist, p.author) && !isAbusive(abusive, p.author) && !isIgnored(p.author) && p.body !== DELETED_POST_BODY
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
            src={FEED_AVATARS.snaps}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-[#3a424a]"
          />
          Snaps
        </h1>
      </div>
      {isAuthenticated && (
        <ComposeFab feedType="snaps" placeholder="What's snapping?" />
      )}
      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {loading && filteredPosts.length === 0 ? (
        renderItems(
          [...Array(useGrid ? 10 : 3)].map((_, i) => <FeedSkeleton key={i} />)
        )
      ) : filteredPosts.length === 0 ? (
        <EmptyState title="No snaps yet" description="Pull to refresh or create one." />
      ) : (
        <>
          {renderItems(
            filteredPosts.map((post) => (
              <PostCard
                key={`${post.author}/${post.permlink}`}
                post={post}
                readOnly={!isAuthenticated}
              />
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
