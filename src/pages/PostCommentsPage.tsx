import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAioha } from '@aioha/react-provider'
import { ArrowLeft, Loader2, AlertCircle, MessageCirclePlus, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import type { NormalizedPost, FeedType } from '../utils/types'
import type { Discussion } from '../utils/commentTypes'
import { getCommentsList } from '../services/commentService'
import { getDiscussion, normalizeBridgePost } from '../services/hiveService'
import { contentHas3SpeakEmbed } from '../utils/3speak'
import { FeedItemBody } from '../components/FeedItemBody'
import { FeedItemOptions } from '../components/FeedItemOptions'
import { AddBookmarkButton } from '../components/AddBookmarkButton'
import { CommentSearchBar } from '../components/comments/CommentSearchBar'
import { CommentTile } from '../components/comments/CommentTile'
import { ReplyComposerModal } from '../components/comments/ReplyComposerModal'

function convertPercentageToWeight(percentage: number): number {
  const clamped = Math.max(0, Math.min(100, percentage))
  return Math.round(clamped * 100)
}

/** Detect the FeedType from a post's json_metadata app field. */
function detectFeedTypeFromMetadata(jsonMetadata?: string): FeedType {
  if (!jsonMetadata) return 'snaps'
  try {
    const parsed = JSON.parse(jsonMetadata)
    const app = (parsed?.app ?? '').toLowerCase()
    if (app.startsWith('ecency')) return 'waves'
    if (app.startsWith('leothreads')) return 'threads'
    if (app.startsWith('peakd')) return 'moments'
    return 'snaps'
  } catch {
    return 'snaps'
  }
}

export function PostCommentsPage() {
  const { author, permlink } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { aioha } = useAioha()
  const { isAuthenticated, username } = useAuthData()

  const [rootPost, setRootPost] = useState<NormalizedPost | null>(
    (location.state as { post?: NormalizedPost } | null)?.post ?? null
  )
  const [comments, setComments] = useState<Discussion[]>([])
  const [filteredComments, setFilteredComments] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ author: string; permlink: string } | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddComment, setShowAddComment] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const ensureCanAct = () => {
    if (!isAuthenticated) {
      toast.info('Please Login')
      return false
    }
    if (!aioha || !aioha.isLoggedIn()) {
      toast.error('Please login with HiveAuth/Keychain')
      return false
    }
    return true
  }

  const resolvedAuthor = author ?? rootPost?.author
  const resolvedPermlink = permlink ?? rootPost?.permlink

  const fetchRootPost = useCallback(async (signal?: AbortSignal) => {
    if (rootPost || !resolvedAuthor || !resolvedPermlink) return
    try {
      const observer = username ?? ''
      const discussion = await getDiscussion(resolvedAuthor, resolvedPermlink, observer, signal)
      if (signal?.aborted) return
      const key = Object.keys(discussion).find(
        (k) => discussion[k]?.author === resolvedAuthor && discussion[k]?.permlink === resolvedPermlink
      )
      if (key) {
        setRootPost(normalizeBridgePost(discussion[key]))
      }
    } catch (err) {
      if (signal?.aborted) return
      console.error('Failed to fetch root post:', err)
    }
  }, [resolvedAuthor, resolvedPermlink, rootPost])

  const fetchComments = useCallback(
    async (isRefresh = false, signal?: AbortSignal) => {
      if (!resolvedAuthor || !resolvedPermlink) return
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      try {
        const fetchedComments = await getCommentsList(resolvedAuthor, resolvedPermlink)
        if (signal?.aborted) return
        setComments(fetchedComments)
        setFilteredComments(fetchedComments)
      } catch (err) {
        if (signal?.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load comments')
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [resolvedAuthor, resolvedPermlink]
  )

  useEffect(() => {
    const abortController = new AbortController()
    void fetchRootPost(abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [fetchRootPost])

  useEffect(() => {
    const abortController = new AbortController()
    void fetchComments(false, abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [fetchComments])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredComments(comments)
    } else {
      const q = searchQuery.toLowerCase()
      const filtered = comments.filter(
        (c) => c.body?.toLowerCase().includes(q) || c.author.toLowerCase().includes(q)
      )
      setFilteredComments(filtered)
    }
  }, [searchQuery, comments])

  const sortedForDisplay = useMemo(() => {
    if (!username?.trim()) return filteredComments
    const user = username.toLowerCase()
    return [...filteredComments].sort((a, b) => {
      const aIsCurrent = a.author?.toLowerCase() === user
      const bIsCurrent = b.author?.toLowerCase() === user
      if (aIsCurrent && !bIsCurrent) return -1
      if (!aIsCurrent && bIsCurrent) return 1
      return 0
    })
  }, [filteredComments, username])

  const topLevelComments = useMemo(
    () =>
      sortedForDisplay.filter(
        (c) => c.parent_author === resolvedAuthor && c.parent_permlink === resolvedPermlink
      ),
    [sortedForDisplay, resolvedAuthor, resolvedPermlink]
  )

  const handleReply = (parentAuthor: string, parentPermlink: string) => {
    setReplyingTo({ author: parentAuthor, permlink: parentPermlink })
  }

  const handleComposerSuccess = useCallback(() => {
    setShowAddComment(false)
    setReplyingTo(null)
    setIsRefreshing(true)
    setTimeout(() => {
      void fetchComments(true)
      setIsRefreshing(false)
    }, 3000)
  }, [fetchComments])

  const handleCommentUpvote = async (
    commentAuthor: string,
    commentPermlink: string,
    percent: number
  ) => {
    if (!ensureCanAct()) return
    if (!aioha) return
    const result = await aioha.vote(
      commentAuthor,
      commentPermlink,
      convertPercentageToWeight(percent)
    )
    if (!result?.success) throw new Error(result?.error ?? 'Comment upvote failed')
    toast.success('Comment upvoted')
  }

  if (!resolvedAuthor || !resolvedPermlink) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Invalid route. Missing post author/permlink.
      </div>
    )
  }

  if (loading && !comments.length && !rootPost) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#e31337]" />
          <p className="text-sm text-zinc-300">Loading post and comments…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-6 text-sm text-red-300">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Failed to load comments</h3>
            <p className="mt-1 text-xs text-red-200">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void fetchComments()}
          className="mt-4 rounded-lg bg-[#e31337] px-4 py-2 text-xs font-medium text-white hover:bg-[#c81131]"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-md border border-[#3a424a] px-3 py-1.5 text-sm text-[#d5dbe2] transition hover:bg-[#2d333b]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {rootPost && (
        <article className="rounded-2xl border border-[#3a424a] bg-[#262b30] p-4">
          <div className="flex items-start gap-3">
            <img
              src={`https://images.hive.blog/u/${rootPost.author}/avatar`}
              alt={rootPost.author}
              className="h-10 w-10 rounded-full border border-[#505863] object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-[#ff8fa3]">@{rootPost.author}</span>
              </div>
              <div className="mt-2">
                <FeedItemBody
                  post={rootPost}
                  hideImages={contentHas3SpeakEmbed(rootPost.body, rootPost.json_metadata)}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <AddBookmarkButton
                  author={rootPost.author}
                  permlink={rootPost.permlink}
                  title={rootPost.title}
                  body={rootPost.body ?? ''}
                  className="rounded-lg p-2 text-zinc-400 transition-colors duration-200 hover:bg-[#2f353d] hover:text-[#e31337]"
                  ariaLabel="Add to bookmarks"
                />
              </div>
            </div>
            <FeedItemOptions
              targetUsername={rootPost.author}
              targetPermlink={rootPost.permlink}
              onReportedAuthor={(reported) => {
                if (reported === rootPost.author) navigate('/dashboard')
              }}
              className="-mt-1"
              ariaLabel="Post options"
            />
          </div>
        </article>
      )}

      <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]">
        <div className="flex items-center justify-between border-b border-[#3a424a] bg-[#20262c] px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
              Comments ({comments.length})
            </h2>
            {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-[#e31337]" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchComments(true)}
              disabled={isRefreshing}
              className="rounded-lg p-2 text-zinc-400 transition-colors duration-200 hover:bg-zinc-800 disabled:opacity-50"
              title="Refresh comments"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#e31337]' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setShowSearch((prev) => !prev)}
              className="rounded-lg p-2 text-zinc-400 transition-colors duration-200 hover:bg-zinc-800"
              title="Search comments"
            >
              {/* Reuse MessageCirclePlus icon as a simple control icon here */}
              <MessageCirclePlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <CommentSearchBar
          isVisible={showSearch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => setShowSearch(false)}
        />

        <div className="flex-1 overflow-y-auto">
          {topLevelComments.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
              <MessageCirclePlus className="mb-4 h-12 w-12 text-zinc-600" />
              <h3 className="mb-2 text-lg font-medium text-zinc-100">
                {searchQuery ? 'No comments found' : 'No comments yet'}
              </h3>
              <p className="mb-6 text-sm text-zinc-400">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Be the first to share your thoughts!'}
              </p>
              {!searchQuery && username && (
                <button
                  type="button"
                  onClick={() => setShowAddComment(true)}
                  className="rounded-lg bg-[#e31337] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#c81131]"
                >
                  Add Comment
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#3a424a]">
              {topLevelComments.map((comment) => (
                <CommentTile
                  key={`${comment.author}/${comment.permlink}`}
                  comment={comment}
                  allComments={sortedForDisplay}
                  onReply={handleReply}
                  currentUser={username || undefined}
                  searchQuery={searchQuery}
                  depth={0}
                  onVotedRefresh={() => void fetchComments(true)}
                  onClickCommentUpvote={handleCommentUpvote}
                  onReportedAuthor={() => void fetchComments(true)}
                />
              ))}
            </div>
          )}
        </div>

        {!showAddComment && username && topLevelComments.length > 0 && (
          <div className="border-t border-[#3a424a] bg-[#20262c] p-4 md:p-6">
            <button
              type="button"
              onClick={() => setShowAddComment(true)}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-[#e31337] px-6 py-3 text-sm font-medium text-white shadow transition-all duration-200 hover:scale-[1.02] hover:bg-[#c81131]"
            >
              <MessageCirclePlus className="h-5 w-5" />
              <span>Add Comment</span>
            </button>
          </div>
        )}
      </div>

      {(showAddComment || replyingTo) && resolvedAuthor && resolvedPermlink && (
        <ReplyComposerModal
          isOpen
          onClose={() => {
            setShowAddComment(false)
            setReplyingTo(null)
          }}
          onSuccess={handleComposerSuccess}
          parentAuthor={replyingTo?.author ?? resolvedAuthor}
          parentPermlink={replyingTo?.permlink ?? resolvedPermlink}
          parentAvatarUrl={
            replyingTo
              ? `https://images.hive.blog/u/${replyingTo.author}/avatar`
              : rootPost
                ? `https://images.hive.blog/u/${rootPost.author}/avatar`
                : undefined
          }
          placeholder={replyingTo ? `Reply to @${replyingTo.author}...` : 'Add a comment...'}
          feedType={detectFeedTypeFromMetadata(rootPost?.json_metadata)}
        />
      )}
    </section>
  )
}
