/**
 * Feed post card: avatar, username, date, rendered body, and custom chain action row.
 * Uses Aioha operations for upvote/reblog/tip and hive-react-kit for upvote list modal.
 */
import { useAioha } from '@aioha/react-ui'
import { KeyTypes } from '@aioha/aioha'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { UpvoteListModal } from 'hive-react-kit'
import { ThumbsUp, MessageCircle, Repeat2, Share2, Gift } from 'lucide-react'
import { AddBookmarkButton } from './AddBookmarkButton'
import { FeedItemOptions } from './FeedItemOptions'
import { FeedItemBody } from './FeedItemBody'
import { EditPostModal } from './EditPostModal'
import { VoteSlider } from './comments/VoteSlider'
import { ReplyComposerModal } from './comments/ReplyComposerModal'
import { PollView, parsePollFromMetadata } from './PollView'
import { contentHas3SpeakEmbed } from '../utils/3speak'
import { getDiscussion, getPost } from '../services/hiveService'
import { parseBodyFromMarkdown } from '../utils/postBody'
import type { NormalizedPost } from '../utils/types'
import { DELETED_POST_BODY } from '../utils/types'
import { useAuthData } from '../stores/authStore'
import { useHiveOperations } from '../hooks/useHiveOperations'
import { useReblogStore } from '../stores/reblogStore'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { useUserCommentsStore } from '../stores/userCommentsStore'
import { isIOS, isMobilePlatform, getShareBaseUrl } from '../utils/platform-detection'
import { useAuthStore } from 'hive-authentication'

const HIVE_AVATAR = (username: string) =>
  `https://images.hive.blog/u/${username}/avatar`

function formatDate(iso: string) {
  try {
    const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'now'
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h`
    return d.toLocaleDateString()
  } catch {
    return iso
  }
}

interface PostCardProps {
  post: NormalizedPost
  /** When true and unauthenticated, protected actions show "Please Login". */
  readOnly?: boolean
}

function convertPercentageToWeight(percentage: number): number {
  const clamped = Math.max(0, Math.min(100, percentage))
  return Math.round(clamped * 100)
}

export function PostCard({ post, readOnly = false }: PostCardProps) {
  const { aioha } = useAioha()
  const { isAuthenticated, username } = useAuthData()
  const { editPost } = useHiveOperations()
  const haAuthStore = useAuthStore()
  const navigate = useNavigate()
  const [showUpvoteSlider, setShowUpvoteSlider] = useState(false)
  const [showUpvoteList, setShowUpvoteList] = useState(false)
  const [upvotePercent, setUpvotePercent] = useState(50)
  const [hasLocalUpvote, setHasLocalUpvote] = useState(false)
  const [displayNetVotes, setDisplayNetVotes] = useState(post.net_votes)
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(false)
  const [showReblogConfirm, setShowReblogConfirm] = useState(false)
  const [reblogSubmitting, setReblogSubmitting] = useState(false)
  const [showTipDialog, setShowTipDialog] = useState(false)
  const [tipAmount, setTipAmount] = useState('')
  const [tipToken, setTipToken] = useState<'HIVE' | 'HBD'>('HIVE')
  const [tipSubmitting, setTipSubmitting] = useState(false)
  const [tipError, setTipError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [showReplyComposer, setShowReplyComposer] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(post.children)

  useEffect(() => {
    setDisplayChildren(post.children)
  }, [post.children])

  // Reblog store: on-demand checking
  const checkReblog = useReblogStore((s) => s.checkReblog)
  const setReblogged = useReblogStore((s) => s.setReblogged)
  const setReblogUsername = useReblogStore((s) => s.setUsername)
  const isReblogged = useReblogStore((s) => s.isReblogged(post.author, post.permlink))
  const [checkingReblog, setCheckingReblog] = useState(false)

  // "I already commented on this post" — shown as a red comment icon.
  // Derived from post.replies (returned by the bridge) + current username,
  // OR an optimistic session mark set right after a successful in-app reply.
  const sessionMarked = useUserCommentsStore((s) => s.isMarked(post.author, post.permlink))
  const markCommented = useUserCommentsStore((s) => s.markCommented)
  const myReplyKey = useMemo(() => {
    if (!username || !post.replies?.length) return null
    const prefix = `${username.toLowerCase()}/`
    return post.replies.find((key) => key.toLowerCase().startsWith(prefix)) ?? null
  }, [username, post.replies])
  const hasCommented = sessionMarked || Boolean(myReplyKey)

  // Hover preview of the current user's reply body — lazy fetched on first hover.
  const [showCommentPreview, setShowCommentPreview] = useState(false)
  const [myReplyBody, setMyReplyBody] = useState<string | null>(null)
  const [loadingMyReply, setLoadingMyReply] = useState(false)
  const handleCommentHoverEnter = () => {
    if (!hasCommented) return
    setShowCommentPreview(true)
    if (myReplyBody !== null || loadingMyReply || !myReplyKey) return
    const [rAuthor, rPermlink] = myReplyKey.split('/')
    if (!rAuthor || !rPermlink) return
    setLoadingMyReply(true)
    void getPost(rAuthor, rPermlink)
      .then((p) => setMyReplyBody(p?.body ?? ''))
      .catch(() => setMyReplyBody(''))
      .finally(() => setLoadingMyReply(false))
  }
  const myReplyPreviewText = useMemo(() => {
    if (!myReplyBody) return ''
    const { plainText } = parseBodyFromMarkdown(myReplyBody)
    return plainText.trim()
  }, [myReplyBody])

  useEffect(() => {
    setDisplayNetVotes(post.net_votes)
  }, [post.net_votes])

  useEffect(() => {
    if (username) setReblogUsername(username)
  }, [username, setReblogUsername])

  const hasUserUpvoted = useMemo(() => {
    if (hasLocalUpvote) return true
    if (!username || !post.active_votes) return false
    const user = username.toLowerCase()
    // If user appears in active_votes, treat it as already voted.
    return post.active_votes.some((v) => v.voter.toLowerCase() === user)
  }, [hasLocalUpvote, username, post.active_votes])

  const ensureCanAct = () => {
    if (readOnly && !isAuthenticated) {
      toast.info('Please Login')
      return false
    }
    // if (!aioha || !aioha.isLoggedIn()) {
    //   toast.error('Please login with HiveAuth/Keychain')
    //   return false
    // }
    return true
  }

  const handleUpvote = async (author: string, permlink: string, percent: number) => {
    await haAuthStore.switchToPostingForCurrentUser();
    if (!ensureCanAct()) return
    if (hasUserUpvoted) {
      toast.info('you have already voted this post')
      return
    }
    const result = await aioha.vote(author, permlink, convertPercentageToWeight(percent))
    if (!result?.success) throw new Error(result?.error ?? 'Upvote failed')
    toast.success('Upvoted')
    setHasLocalUpvote(true)
    setDisplayNetVotes((prev) => prev + 1)
    setTimeout(() => {
      void refreshVoteCount()
    }, 5000)
  }

  const refreshVoteCount = async () => {
    try {
      const observer = username ?? ''
      const discussion = await getDiscussion(post.author, post.permlink, observer)
      const root = Object.values(discussion).find(
        (item) => item.author === post.author && item.permlink === post.permlink
      )
      if (!root) return
      const nextVotes =
        typeof root.stats?.total_votes === 'number'
          ? root.stats.total_votes
          : Array.isArray(root.active_votes)
            ? root.active_votes.length
            : displayNetVotes
      setDisplayNetVotes(nextVotes)
    } catch {
      // Keep current count if refresh fails.
    }
  }

  const checkAlreadyVotedOnChain = async (): Promise<boolean> => {
    if (!username) return false
    try {
      const discussion = await getDiscussion(post.author, post.permlink, username)
      const root = Object.values(discussion).find(
        (item) => item.author === post.author && item.permlink === post.permlink
      )
      if (!root?.active_votes) return false
      const user = username.toLowerCase()
      return root.active_votes.some((vote) => {
        const voter = String(vote.voter ?? '').toLowerCase()
        // In some responses rshares can be 0 even when percent is non-zero.
        // If voter exists in active_votes, we should block revote.
        return voter === user
      })
    } catch {
      return false
    }
  }

  const openVoteSlider = async (): Promise<boolean> => {
    await haAuthStore.switchToPostingForCurrentUser()
    if (!ensureCanAct()) return false
    if (hasUserUpvoted) {
      toast.info('you have already voted this post')
      return false
    }
    setCheckingVoteStatus(true)
    const alreadyVoted = await checkAlreadyVotedOnChain()
    setCheckingVoteStatus(false)
    if (alreadyVoted) {
      setHasLocalUpvote(true)
      toast.info('you have already voted this post')
      return false
    }
    setShowUpvoteSlider(true)
    return true
  }

  const handleReblogClick = async () => {
    await haAuthStore.switchToPostingForCurrentUser()
    if (!ensureCanAct()) return
    setCheckingReblog(true)
    try {
      await checkReblog(post.author, post.permlink)
    } finally {
      setCheckingReblog(false)
    }
    setShowReblogConfirm(true)
  }

  const handleConfirmReblog = async () => {
    await haAuthStore.switchToPostingForCurrentUser()
    if (!ensureCanAct()) return
    setReblogSubmitting(true)
    try {
      const shouldDelete = isReblogged
      const result = await aioha.reblog(post.author, post.permlink, shouldDelete)
      if (result && typeof result === 'object' && result.success === true) {
        setReblogged(post.author, post.permlink, !shouldDelete)
        setShowReblogConfirm(false)
        toast.success(shouldDelete ? 'Reblog removed' : 'Reblogged successfully')
      } else {
        const errMsg = (result as { error?: string })?.error ?? 'Reblog failed'
        throw new Error(errMsg)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Reblog failed'
      const lower = msg.toLowerCase()
      if (lower.includes('cancel') || lower.includes('reject') || lower.includes('denied')) {
        toast.error('Reblog cancelled')
      } else {
        toast.error(msg)
      }
    } finally {
      setReblogSubmitting(false)
    }
  }

  const handleShare = async () => {
    const postUrl = `${getShareBaseUrl()}/#/@${post.author}/${post.permlink}`
    try {
      if (!isMobilePlatform() && navigator.share) {
        await navigator.share({ url: postUrl, title: `Post by @${post.author}` })
        toast.success('Link shared')
      } else {
        await navigator.clipboard.writeText(postUrl)
        toast.success('Link copied')
      }
    } catch {
      // toast.error('Could not share link')
      console.error('Share failed')
    }
  }

  const handleOpenTipDialog = async () => {
    await haAuthStore.switchToPostingForCurrentUser()
    if (!ensureCanAct()) return
    setTipError(null)
    setTipAmount('')
    setTipToken('HIVE')
    setShowTipDialog(true)
  }

  const handleSubmitTip = async () => {
    await haAuthStore.switchToPostingForCurrentUser()
    if (!ensureCanAct()) return
    const parsed = Number.parseFloat(tipAmount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setTipError('Enter a valid amount greater than 0.')
      return
    }
    setTipSubmitting(true)
    setTipError(null)
    try {
      const amount = `${parsed.toFixed(3)} ${tipToken}`
      const result = await aioha.signAndBroadcastTx(
        [[
          'transfer',
          {
            from: username,
            to: post.author,
            amount,
            memo: `!tip @${post.author}/${post.permlink} @${username} app:hsnaps message:Tip sent through hSnaps`,
          },
        ]],
        KeyTypes.Active
      )
      if (result && typeof result === 'object' && result.success === true) {
        toast.success('Tip sent successfully')
        setShowTipDialog(false)
        return
      }
      const errMsg = (result as { error?: string })?.error ?? 'Tip failed'
      throw new Error(errMsg)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Tip failed'
      const lower = msg.toLowerCase()
      if (lower.includes('cancel') || lower.includes('reject') || lower.includes('denied')) {
        setTipError('Tip cancelled.')
      } else {
        setTipError(msg)
      }
    } finally {
      setTipSubmitting(false)
    }
  }

  const handleCommentRoute = () => {
    navigate(`/@${post.author}/${post.permlink}`, { state: { post } })
  }

  const handleAuthorRoute = () => {
    navigate(`/@${post.author}`)
  }

  /** Remove a post locally from all feed stores. */
  const removePostFromAllStores = (author: string, permlink: string) => {
    useSnapsStore.getState().removePost(author, permlink)
    useThreadsStore.getState().removePost(author, permlink)
    useWavesStore.getState().removePost(author, permlink)
    useMomentStore.getState().removePost(author, permlink)
  }

  /** Update a post body locally in all feed stores. */
  const updatePostInAllStores = (author: string, permlink: string, newBody: string) => {
    useSnapsStore.getState().updatePostBody(author, permlink, newBody)
    useThreadsStore.getState().updatePostBody(author, permlink, newBody)
    useWavesStore.getState().updatePostBody(author, permlink, newBody)
    useMomentStore.getState().updatePostBody(author, permlink, newBody)
  }

  const handleConfirmDelete = async () => {
    if (!post.parent_author || !post.parent_permlink) {
      toast.error('Cannot delete: missing parent post info')
      return
    }
    setDeleteSubmitting(true)
    try {
      await editPost(
        post.parent_author,
        post.parent_permlink,
        post.permlink,
        DELETED_POST_BODY,
        post.title,
        post.json_metadata ?? '{}'
      )
      toast.success('Post deleted successfully')
      setShowDeleteConfirm(false)
      // Locally remove from all feed stores so UI updates immediately
      removePostFromAllStores(post.author, post.permlink)
    } catch {
      // error toast already shown by useHiveOperations
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const pollData = useMemo(() => parsePollFromMetadata(post.json_metadata), [post.json_metadata])

  const parentTags = useMemo<string[]>(() => {
    if (!post.json_metadata) return []
    try {
      const meta = JSON.parse(post.json_metadata) as { tags?: string[] }
      return Array.isArray(meta.tags) ? meta.tags.filter((t): t is string => typeof t === 'string') : []
    } catch { return [] }
  }, [post.json_metadata])

  const isHSnapsPost = useMemo(
    () => parentTags.some((t) => t.toLowerCase() === 'hsnaps'),
    [parentTags],
  )

  const actionBtnClass =
    'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[#9ca3b0] transition-colors duration-200 hover:bg-[#2f353d] hover:text-[#f0f0f8]'

  return (
    <article className={`break-inside-avoid rounded-2xl border bg-[#262b30] transition-colors duration-200 ${
      isHSnapsPost
        ? 'border-[#e31337]/50 shadow-[0_0_12px_rgba(227,19,55,0.15)] hover:border-[#e31337]/70'
        : 'border-[#3a424a] hover:border-[#e31337]/40'
    }`}>
      {/* Header: avatar + author + date + options */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-0">
        <button
          type="button"
          onClick={handleAuthorRoute}
          className="shrink-0 rounded-full outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[#e31337]/60"
        >
          <img
            src={HIVE_AVATAR(post.author)}
            alt={post.author}
            onError={(e) => { e.currentTarget.src = HIVE_AVATAR('null') }}
            className="h-9 w-9 rounded-full border border-[#505863] object-cover"
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAuthorRoute}
              className="truncate text-left text-sm font-semibold text-[#ff8fa3] hover:underline"
            >
              @{post.author}
            </button>
            <span className="shrink-0 text-xs text-[#9ca3b0]">{formatDate(post.created)}</span>
            {isHSnapsPost && (
              <span className="shrink-0 rounded-full bg-[#e31337]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#e31337]">
                hSnaps
              </span>
            )}
          </div>
        </div>
        <FeedItemOptions
          targetUsername={post.author}
          targetPermlink={post.permlink}
          ariaLabel="Post options"
          onEdit={() => setShowEditModal(true)}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      </div>

      {/* Body: plain text + swipable images, 3speak, Twitter, YouTube */}
      <div
        className="px-4 pt-2 pb-1 overflow-hidden cursor-pointer"
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('a, button, input, textarea, select, video, iframe, img, [role="button"], [role="dialog"]')) return
          handleCommentRoute()
        }}
      >
        <FeedItemBody
          post={post}
          hideImages={contentHas3SpeakEmbed(post.body, post.json_metadata)}
        />
        {pollData && <PollView poll={pollData} author={post.author} permlink={post.permlink} />}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 border-t border-[#3a424a]/60 px-2 py-1.5">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => void openVoteSlider()}
            disabled={checkingVoteStatus}
            className={actionBtnClass}
            aria-label="Upvote"
          >
            <ThumbsUp
              className={`h-4 w-4 ${
                hasUserUpvoted ? 'fill-[#e31337] text-[#e31337]' : 'text-[#e31337]'
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setShowUpvoteList(true)}
            className="rounded-lg px-1.5 py-1.5 text-xs font-medium text-[#ff8fa3] transition-colors duration-200 hover:bg-[#2f353d]"
            aria-label="Open upvote list"
          >
            {displayNetVotes}
          </button>
        </div>

        <div className="flex items-center">
          <div
            className="relative"
            onMouseEnter={handleCommentHoverEnter}
            onMouseLeave={() => setShowCommentPreview(false)}
          >
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.info('Please log in to reply')
                  return
                }
                setShowReplyComposer(true)
              }}
              className={actionBtnClass}
              aria-label={hasCommented ? "Reply to post (you've already commented)" : 'Reply to post'}
            >
              <MessageCircle
                className={`h-4 w-4 ${hasCommented ? 'fill-[#e31337] text-[#e31337]' : ''}`}
              />
            </button>
            {hasCommented && showCommentPreview && (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-lg border border-[#3a424a] bg-[#1f2429] p-3 shadow-xl">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#ff8fa3]">
                  Your comment
                </p>
                {loadingMyReply && (
                  <p className="text-xs text-[#9ca3b0]">Loading…</p>
                )}
                {!loadingMyReply && myReplyPreviewText && (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#e7e7f1] line-clamp-6">
                    {myReplyPreviewText}
                  </p>
                )}
                {!loadingMyReply && !myReplyPreviewText && myReplyBody !== null && (
                  <p className="text-xs italic text-[#9ca3b0]">No preview available.</p>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleCommentRoute}
            className={`rounded-lg px-1.5 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-[#2f353d] ${
              hasCommented ? 'text-[#ff8fa3]' : 'text-[#9ca3b0] hover:text-[#f0f0f8]'
            }`}
            aria-label="Open comments"
          >
            {displayChildren}
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleReblogClick()}
          disabled={reblogSubmitting || checkingReblog}
          className={actionBtnClass}
          aria-label="Reblog"
        >
          {checkingReblog ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#9ca3b0] border-t-transparent" />
          ) : (
            <Repeat2 className={`h-4 w-4 ${isReblogged ? 'text-[#3b82f6]' : ''}`} />
          )}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => void handleShare()}
          className={actionBtnClass}
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>

        <AddBookmarkButton
          author={post.author}
          permlink={post.permlink}
          title={post.title}
          body={post.body ?? ''}
          className={actionBtnClass}
          ariaLabel="Add to bookmarks"
        />

        {!isIOS() && (
          <button
            type="button"
            onClick={handleOpenTipDialog}
            className={actionBtnClass}
            aria-label="Tip"
          >
            <Gift className="h-4 w-4" />
          </button>
        )}

        {!isIOS() && post.payout > 0 && (
          <span className="shrink-0 text-xs font-medium text-[#22c55e]">
            ${post.payout.toFixed(2)}
          </span>
        )}
      </div>

      {showUpvoteList && (
        <UpvoteListModal
          author={post.author}
          permlink={post.permlink}
          currentUser={username || undefined}
          onClose={() => setShowUpvoteList(false)}
          onClickUpvoteButton={async () => {
            const opened = await openVoteSlider()
            if (opened) setShowUpvoteList(false)
          }}
        />
      )}
      {showUpvoteSlider && (
        <VoteSlider
          author={post.author}
          defaultValue={upvotePercent}
          onUpvote={async (percent) => {
            setUpvotePercent(percent)
            await handleUpvote(post.author, post.permlink, percent)
            setShowUpvoteSlider(false)
          }}
          onCancel={() => setShowUpvoteSlider(false)}
        />
      )}
      {showReblogConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#3a424a] bg-[#262b30] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {isReblogged ? 'Remove reblog?' : 'Reblog this post?'}
            </h3>
            <p className="mt-2 text-sm text-[#9ca3b0]">
              {isReblogged
                ? 'This post will be removed from your blog and personal feed.'
                : 'This post will appear on your blog and personal feed.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReblogConfirm(false)}
                disabled={reblogSubmitting}
                className="rounded-lg border border-[#3a424a] bg-[#262b30] px-4 py-2 text-sm font-medium text-[#f0f0f8] transition-colors hover:bg-[#2f353d] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmReblog()}
                disabled={reblogSubmitting}
                className="rounded-lg border border-[#e31337]/60 bg-[#e31337] px-4 py-2 text-sm font-semibold text-[#f0f0f8] transition-colors hover:bg-[#c0102f] disabled:opacity-50"
              >
                {reblogSubmitting
                  ? 'Confirming...'
                  : isReblogged
                    ? 'Remove reblog'
                    : 'Reblog'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showTipDialog && !isIOS() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#3a424a] bg-[#262b30] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Send tip</h3>
            <p className="mt-1 text-sm text-[#9ca3b0]">
              Send tip to @{post.author}
            </p>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                step="0.001"
                min="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="Amount"
                className="w-full rounded-lg border border-[#3a424a] bg-[#1a1e22] px-3 py-2 text-sm text-white placeholder-[#9ca3b0] outline-none focus:border-[#e31337]/60"
              />
              <select
                value={tipToken}
                onChange={(e) => setTipToken(e.target.value as 'HIVE' | 'HBD')}
                className="rounded-lg border border-[#3a424a] bg-[#1a1e22] px-3 py-2 text-sm text-white outline-none focus:border-[#e31337]/60"
              >
                <option value="HIVE">HIVE</option>
                <option value="HBD">HBD</option>
              </select>
            </div>
            {tipError && (
              <p className="mt-3 rounded-md border border-[#e31337]/45 bg-[#e31337]/12 px-3 py-2 text-sm text-[#f0f0f8]">
                {tipError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTipDialog(false)}
                disabled={tipSubmitting}
                className="rounded-lg border border-[#3a424a] bg-[#262b30] px-4 py-2 text-sm font-medium text-[#f0f0f8] transition-colors hover:bg-[#2f353d] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitTip()}
                disabled={tipSubmitting}
                className="rounded-lg border border-[#e31337]/60 bg-[#e31337] px-4 py-2 text-sm font-semibold text-[#f0f0f8] transition-colors hover:bg-[#c0102f] disabled:opacity-50"
              >
                {tipSubmitting ? 'Sending...' : 'Tip'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReplyComposer && (
        <ReplyComposerModal
          isOpen={showReplyComposer}
          onClose={() => setShowReplyComposer(false)}
          onSuccess={() => {
            setDisplayChildren((prev) => prev + 1)
            markCommented(post.author, post.permlink)
          }}
          parentAuthor={post.author}
          parentPermlink={post.permlink}
          alreadyVoted={hasUserUpvoted}
          parentTags={parentTags}
        />
      )}
      {showEditModal && (
        <EditPostModal
          post={post}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={(newBody) => {
            setShowEditModal(false)
            // Locally update body in all feed stores so UI reflects the edit immediately
            updatePostInAllStores(post.author, post.permlink, newBody)
          }}
        />
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#3a424a] bg-[#262b30] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete this post?</h3>
            <p className="mt-2 text-sm text-[#9ca3b0]">
              This action cannot be undone. The post content will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteSubmitting}
                className="rounded-lg border border-[#3a424a] bg-[#262b30] px-4 py-2 text-sm font-medium text-[#f0f0f8] transition-colors hover:bg-[#2f353d] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleteSubmitting}
                className="rounded-lg border border-red-500/60 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteSubmitting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
