/**
 * Snaps feed: bridge.get_account_posts → bridge.get_discussion (replies = snaps).
 * FeedComposer at top when logged in; hidden for guests (read-only).
 */
import { useEffect } from 'react'
import { useSnapsStore } from '../../stores/snapsStore'
import { useAuthData } from '../../stores/authStore'
import { PostCard } from '../../components/PostCard'
import { ComposeFab } from '../../components/ComposeFab'
import { FeedSkeleton } from '../../components/FeedSkeleton'
import { EmptyState } from '../../components/EmptyState'

export function SnapsFeed() {
  const { isAuthenticated } = useAuthData()
  const { posts, loading, error, hasMore, fetchFeed, loadMore } = useSnapsStore()

  useEffect(() => {
    let cancelled = false
    fetchFeed().then(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [fetchFeed])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Snaps</h1>
      </div>
      {isAuthenticated && (
        <ComposeFab
          feedType="snaps"
          placeholder="What's snapping?"
        />
      )}
      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <FeedSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No snaps yet"
          description="Pull to refresh or create one."
        />
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={`${post.author}/${post.permlink}`} post={post} readOnly={!isAuthenticated} />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => loadMore()}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-700 py-3 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
