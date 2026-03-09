/**
 * Single feed column: vertical scroll list of PostCards (no grid/masonry).
 */
import { useAuthData } from '../stores/authStore'
import { useFeedFilterStore } from '../stores/feedFilterStore'
import { PostCard } from './PostCard'
import { FeedSkeleton } from './FeedSkeleton'
import { EmptyState } from './EmptyState'
import type { UnifiedFeedType } from '../hooks/useFeedByType'
import { useFeedByType } from '../hooks/useFeedByType'
import { FEED_LABELS, FEED_AVATARS } from '../constants/feeds'

interface FeedColumnContentProps {
  feedType: UnifiedFeedType
  showTitle?: boolean
}

export function FeedColumnContent({ feedType, showTitle = false }: FeedColumnContentProps) {
  const { isAuthenticated } = useAuthData()
  const feedFilter = useFeedFilterStore((s) => s.feedFilter)
  const { posts, loading, error, hasMore, loadMore } = useFeedByType(feedType)

  return (
    <div className="flex h-full flex-col">
      {showTitle && (
        <h2 className="mb-3 flex shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#9ca3b0]">
          <img
            src={FEED_AVATARS[feedType]}
            alt=""
            className="h-6 w-6 rounded-full object-cover ring-1 ring-[#3a424a]"
          />
          {FEED_LABELS[feedType]}
        </h2>
      )}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        {loading && posts.length === 0 ? (
          [...Array(3)].map((_, i) => <FeedSkeleton key={i} />)
        ) : posts.length === 0 && !hasMore ? (
          <EmptyState
            title={`No ${FEED_LABELS[feedType].toLowerCase()} yet`}
            description="Pull to refresh or create one."
          />
        ) : (
          <>
            {posts.length === 0 && hasMore ? (
              <EmptyState
                title={
                  feedFilter === 'my_feed'
                    ? 'No posts on this page'
                    : feedFilter === 'following'
                      ? 'No posts from followed users here'
                      : `No ${FEED_LABELS[feedType].toLowerCase()} yet`
                }
                description="Load more to see more content."
              />
            ) : (
              posts.map((post) => (
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
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
