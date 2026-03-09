import { useEffect } from 'react'
import Masonry from 'react-masonry-css'
import { useMomentStore } from '../../stores/momentStore'
import { useAuthData } from '../../stores/authStore'
import { useReputationStore, checkLowReputation } from '../../stores/reputationStore'
import { useIgnoredAuthorsStore } from '../../stores/ignoredAuthorsStore'
import { useViewStore } from '../../stores/viewStore'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { PostCard } from '../../components/PostCard'
import { ComposeFab } from '../../components/ComposeFab'
import { FeedSkeleton } from '../../components/FeedSkeleton'
import { EmptyState } from '../../components/EmptyState'
import { FEED_AVATARS } from '../../constants/feeds'

const MASONRY_BP = { default: 5, 1919: 4, 1279: 3, 1023: 2, 639: 1 }

export function MomentFeed() {
  const { isAuthenticated } = useAuthData()
  const { posts, loading, error, hasMore, fetchFeed, loadMore } = useMomentStore()
  const repCache = useReputationStore((s) => s.cache)
  const viewMode = useViewStore((s) => s.viewMode)
  const isDesktop = useIsDesktop()
  const useGrid = isDesktop && viewMode === 'grid'

  useEffect(() => {
    let cancelled = false
    fetchFeed().then(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [fetchFeed])

  const isIgnored = useIgnoredAuthorsStore((s) => s.isIgnored)
  const filteredPosts = posts.filter(
    (p) => !checkLowReputation(repCache, p.author) && !isIgnored(p.author)
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
            src={FEED_AVATARS.moments}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-[#3a424a]"
          />
          Moments
        </h1>
      </div>
      {isAuthenticated && (
        <ComposeFab feedType="moments" placeholder="Capture a moment..." />
      )}
      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {loading && filteredPosts.length === 0 ? (
        renderItems(
          [...Array(useGrid ? 10 : 3)].map((_, i) => <FeedSkeleton key={i} />)
        )
      ) : filteredPosts.length === 0 ? (
        <EmptyState title="No moments yet" description="Capture one." />
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
