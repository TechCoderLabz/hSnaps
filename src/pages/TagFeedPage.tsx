/**
 * Tag feed: all posts that contain the given hashtag across Snaps, Ecency, Threads, Liketu.
 * Back button returns to dashboard. Uses HashRouter path /tags/:tag.
 */
import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { useBlacklistStore, isBlacklisted } from '../stores/blacklistStore'
import { useAbusiveUsersStore, isAbusive } from '../stores/abusiveUsersStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { postMatchesTag } from '../utils/postBody'
import type { NormalizedPost } from '../utils/types'
import { PostCard } from '../components/PostCard'
import { FeedSkeleton } from '../components/FeedSkeleton'
import { useAuthData } from '../stores/authStore'

const feedSlice = (s: { posts: NormalizedPost[]; loading: boolean }) => ({
  posts: s.posts,
  loading: s.loading,
})

function fetchAllFeeds(signal?: AbortSignal) {
  useSnapsStore.getState().fetchFeed(signal)
  useThreadsStore.getState().fetchFeed(signal)
  useWavesStore.getState().fetchFeed(signal)
  useMomentStore.getState().fetchFeed(signal)
}

export function TagFeedPage() {
  const { tag } = useParams<{ tag: string }>()
  const tagSlug = tag ?? ''
  const decodedTag = decodeURIComponent(tagSlug)

  const snaps = useSnapsStore(useShallow(feedSlice))
  const threads = useThreadsStore(useShallow(feedSlice))
  const waves = useWavesStore(useShallow(feedSlice))
  const moments = useMomentStore(useShallow(feedSlice))
  const blacklist = useBlacklistStore((s) => s.set)
  const abusive = useAbusiveUsersStore((s) => s.set)
  const isIgnored = useIgnoredAuthorsStore((s) => s.isIgnored)
  const { isAuthenticated } = useAuthData()

  useEffect(() => {
    const abortController = new AbortController()
    fetchAllFeeds(abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [])

  const { posts, loading } = useMemo(() => {
    const combined: NormalizedPost[] = []
    const seen = new Set<string>()
    const key = (p: NormalizedPost) => `${p.author}/${p.permlink}`
    for (const p of [...snaps.posts, ...threads.posts, ...waves.posts, ...moments.posts]) {
      if (seen.has(key(p))) continue
      seen.add(key(p))
      if (postMatchesTag(p, tagSlug)) combined.push(p)
    }
    const filtered = combined.filter(
      (p) => !isBlacklisted(blacklist, p.author) && !isAbusive(abusive, p.author) && !isIgnored(p.author)
    )
    filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    const isLoading = snaps.loading || threads.loading || waves.loading || moments.loading
    return { posts: filtered, loading: isLoading }
  }, [
    snaps.posts,
    snaps.loading,
    threads.posts,
    threads.loading,
    waves.posts,
    waves.loading,
    moments.posts,
    moments.loading,
    tagSlug,
    blacklist,
    abusive,
    isIgnored,
  ])

  return (
    <div className="flex min-h-screen flex-col bg-[#212529] text-[#f0f0f8]">
      <header className="app-header-safe-area sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-[#3a424a] bg-[#212529]/95 px-4 py-3 sm:px-6">
        <Link
          to="/dashboard"
          className="rounded-lg px-2 py-1.5 text-sm text-[#9ca3b0] transition-colors hover:bg-[#3a424a] hover:text-[#f0f0f8]"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-[#f0f0f8]">#{decodedTag}</h1>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {loading && posts.length === 0 ? (
          [...Array(3)].map((_, i) => <FeedSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <div className="rounded-xl bg-[#262b30] px-4 py-8 text-center text-[#9ca3b0]">
            No posts with #{decodedTag} yet.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={`${post.author}/${post.permlink}`}
                post={post}
                readOnly={!isAuthenticated}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
