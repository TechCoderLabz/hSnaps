/**
 * Feed post card: avatar, username, date, rendered body, and custom chain action row.
 * Uses Aioha operations for upvote/reblog/tip and hive-react-kit for upvote list modal.
 */
import { useAioha } from '@aioha/react-provider'
import { KeyTypes } from '@aioha/aioha'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { UpvoteListModal } from 'hive-react-kit'
import { Heart, MessageCircle, Repeat2, Share2, Gift } from 'lucide-react'
import { AddBookmarkButton } from './AddBookmarkButton'
import { FeedItemOptions } from './FeedItemOptions'
import { FeedItemBody } from './FeedItemBody'
import { VoteSlider } from './comments/VoteSlider'
import { contentHas3SpeakEmbed } from '../utils/3speak'
import { getDiscussion } from '../services/hiveService'
import type { NormalizedPost } from '../utils/types'
import { useAuthData } from '../stores/authStore'
import { useReblogStore } from '../stores/reblogStore'
import { useReputationStore } from '../stores/reputationStore'
import { isIOS } from '../utils/platform-detection'

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

  // Reblog store: on-demand checking
  const checkReblog = useReblogStore((s) => s.checkReblog)
  const setReblogged = useReblogStore((s) => s.setReblogged)
  const setReblogUsername = useReblogStore((s) => s.setUsername)
  const isReblogged = useReblogStore((s) => s.isReblogged(post.author, post.permlink))
  const [checkingReblog, setCheckingReblog] = useState(false)

  // Register author for reputation checking
  const registerAuthor = useReputationStore((s) => s.registerAuthor)

  useEffect(() => {
    setDisplayNetVotes(post.net_votes)
  }, [post.net_votes])

  // Register author for reputation checking + set reblog username on mount
  useEffect(() => {
    registerAuthor(post.author)
    if (username) setReblogUsername(username)
  }, [post.author, registerAuthor, username, setReblogUsername])

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
    if (!aioha || !aioha.isLoggedIn()) {
      toast.error('Please login with HiveAuth/Keychain')
      return false
    }
    return true
  }

  const handleUpvote = async (author: string, permlink: string, percent: number) => {
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
    const postUrl = `${window.location.origin}/snap/${post.author}/${post.permlink}`
    try {
      if (navigator.share) {
        await navigator.share({ url: postUrl, title: `Post by @${post.author}` })
      } else {
        await navigator.clipboard.writeText(postUrl)
      }
      toast.success('Link shared')
    } catch {
      toast.error('Could not share link')
    }
  }

  const handleOpenTipDialog = () => {
    if (!ensureCanAct()) return
    setTipError(null)
    setTipAmount('')
    setTipToken('HIVE')
    setShowTipDialog(true)
  }

  const handleSubmitTip = async () => {
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
            memo: `Tip from @${username} via hSnaps`,
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
    navigate(`/snap/${post.author}/${post.permlink}`, { state: { post } })
  }

  const actionBtnClass =
    'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[#9ca3b0] transition-colors duration-200 hover:bg-[#2f353d] hover:text-[#f0f0f8]'

  return (
    <article className="break-inside-avoid rounded-2xl border border-[#3a424a] bg-[#262b30] transition-colors duration-200 hover:border-[#e31337]/40">
      {/* Header: avatar + author + date + options */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-0">
        <a
          href={`https://hive.blog/@${post.author}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <img
            src={HIVE_AVATAR(post.author)}
            alt={post.author}
            onError={(e) => { e.currentTarget.src = HIVE_AVATAR('null') }}
            className="h-9 w-9 rounded-full border border-[#505863] object-cover"
          />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#ff8fa3]">@{post.author}</span>
            <span className="shrink-0 text-xs text-[#9ca3b0]">{formatDate(post.created)}</span>
          </div>
        </div>
        <FeedItemOptions
          targetUsername={post.author}
          targetPermlink={post.permlink}
          ariaLabel="Post options"
        />
      </div>

      {/* Body: plain text + swipable images, 3speak, Twitter, YouTube */}
      <div className="px-4 pt-2 pb-1 overflow-hidden">
        <FeedItemBody
          post={post}
          hideImages={contentHas3SpeakEmbed(post.body, post.json_metadata)}
        />
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
            <Heart
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

        <button
          type="button"
          onClick={handleCommentRoute}
          className={actionBtnClass}
          aria-label="Open comments"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{post.children}</span>
        </button>

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
    </article>
  )
}
