/**
 * Snaps feed: bridge.get_account_posts → bridge.get_discussion (replies = snaps).
 * FeedComposer at top when logged in; hidden for guests (read-only).
 */
import { useEffect } from 'react'
import Masonry from 'react-masonry-css'
import { useSnapsStore } from '../../stores/snapsStore'
import { useAuthData } from '../../stores/authStore'
import { useReputationStore, checkLowReputation } from '../../stores/reputationStore'
import { useViewStore } from '../../stores/viewStore'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { PostCard } from '../../components/PostCard'
import { ComposeFab } from '../../components/ComposeFab'
import { FeedSkeleton } from '../../components/FeedSkeleton'
import { EmptyState } from '../../components/EmptyState'

const MASONRY_BP = { default: 5, 1919: 4, 1279: 3, 1023: 2, 639: 1 }

export function SnapsFeed() {
  const { isAuthenticated } = useAuthData()
  const { posts, loading, error, hasMore, fetchFeed, loadMore } = useSnapsStore()
  const repCache = useReputationStore((s) => s.cache)
  const viewMode = useViewStore((s) => s.viewMode)
  const isDesktop = useIsDesktop()
  const useGrid = isDesktop && viewMode === 'grid'

  useEffect(() => {
    let cancelled = false
    fetchFeed().then(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [fetchFeed])

  const filteredPosts = posts.filter((p) => !checkLowReputation(repCache, p.author))

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
        <h1 className="text-xl font-bold text-zinc-100">Snaps</h1>
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
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
