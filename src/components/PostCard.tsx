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
import { MarkdownPreview } from './MarkdownPreview'
import { VoteSlider } from './comments/VoteSlider'
import { getDiscussion } from '../services/hiveService'
import type { NormalizedPost } from '../utils/types'
import { useAuthData } from '../stores/authStore'

const HIVE_AVATAR = (username: string) =>
  `https://images.hive.blog/u/${username}/avatar`

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
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

  useEffect(() => {
    setDisplayNetVotes(post.net_votes)
  }, [post.net_votes])

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
      const discussion = await getDiscussion(post.author, post.permlink)
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
      const discussion = await getDiscussion(post.author, post.permlink)
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

  const handleReblog = async () => {
    if (!ensureCanAct()) return
    const result = await aioha.reblog(post.author, post.permlink, false)
    if (!result?.success) throw new Error(result?.error ?? 'Reblog failed')
    toast.success('Reblogged')
  }

  const handleShare = async () => {
    const postUrl = post.url?.startsWith('http')
      ? post.url
      : `https://hive.blog${post.url || `/@${post.author}/${post.permlink}`}`
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

  const handleTip = async () => {
    if (!ensureCanAct()) return
    const amountInput = window.prompt('Enter tip amount (HIVE)', '0.100')
    if (!amountInput) return
    const parsed = Number.parseFloat(amountInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Invalid amount')
      return
    }
    const result = await aioha.signAndBroadcastTx(
      [[
        'transfer',
        {
          from: username,
          to: post.author,
          amount: `${parsed.toFixed(3)} HIVE`,
          memo: `Tip from @${username} via hSnaps`,
        },
      ]],
      KeyTypes.Active
    )
    if (!result?.success) throw new Error(result?.error ?? 'Tip failed')
    toast.success('Tip sent')
  }

  const handleCommentRoute = () => {
    navigate(`/dashboard/post/${post.author}/${post.permlink}`, { state: { post } })
  }

  return (
    <article className="rounded-2xl border border-[#3a424a] bg-[#262b30] p-4 transition hover:border-[#e31337]/40">
      <div className="flex items-start gap-3">
        <a
          href={`https://hive.blog/@${post.author}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <img
            src={HIVE_AVATAR(post.author)}
            alt={post.author}
            className="h-10 w-10 rounded-full border border-[#505863] object-cover"
          />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[#ff8fa3]">@{post.author}</span>
            <span className="text-xs text-[#9ca3b0]">{formatDate(post.created)}</span>
          </div>
          <div className="mt-2 overflow-hidden">
            <MarkdownPreview content={post.body} className="!p-0 !border-0 !bg-transparent" />
          </div>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#c5ccd4]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void openVoteSlider()}
                  disabled={checkingVoteStatus}
                  className="inline-flex items-center rounded-md px-1.5 py-1 transition hover:bg-[#313840]"
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
                  className="rounded-md px-1.5 py-1 text-[#ff8fa3] transition hover:bg-[#313840]"
                  aria-label="Open upvote list"
                >
                  {displayNetVotes}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCommentRoute}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-[#313840]"
                aria-label="Open comments"
              >
                <MessageCircle className="h-4 w-4" />
                {post.children}
              </button>

              <button
                type="button"
                onClick={() => void handleReblog()}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-[#313840]"
                aria-label="Reblog"
              >
                <Repeat2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-[#313840]"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => void handleTip()}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-[#313840]"
                aria-label="Tip"
              >
                <Gift className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
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
    </article>
  )
}
