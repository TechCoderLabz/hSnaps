/**
 * Feed post card: avatar, username, date, rendered body, and chain actions via hive-react-kit.
 * Uses Aioha operations for upvote/comment/reblog/tip.
 */
import { useAioha } from '@aioha/react-provider'
import { KeyTypes } from '@aioha/aioha'
import { toast } from 'sonner'
import { PostActionButton } from 'hive-react-kit'
import { MarkdownPreview } from './MarkdownPreview'
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

function generateRandomPermlink(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

export function PostCard({ post, readOnly = false }: PostCardProps) {
  const { aioha } = useAioha()
  const { isAuthenticated, username } = useAuthData()
  const hiveValue = (post.payout || post.total_payout || 0).toFixed(3)
    .toString() + ' HIVE'

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
    const result = await aioha.vote(author, permlink, convertPercentageToWeight(percent))
    if (!result?.success) throw new Error(result?.error ?? 'Upvote failed')
    toast.success('Upvoted')
  }

  const handleComment = async (parentAuthor: string, parentPermlink: string, body: string) => {
    if (!ensureCanAct()) return
    const permlink = generateRandomPermlink()
    const result = await aioha.comment(
      parentAuthor,
      parentPermlink,
      permlink,
      `Re: ${parentAuthor}'s post`,
      body,
      JSON.stringify({ app: 'hsnaps/1.0.0', format: 'markdown' })
    )
    if (!result?.success) throw new Error(result?.error ?? 'Comment failed')
    toast.success('Comment posted')
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

  const handleReport = () => {
    if (readOnly && !isAuthenticated) {
      toast.info('Please Login')
      return
    }
    toast.info('Report flow will be added next')
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
          <div className="mt-3">
            <PostActionButton
              author={post.author}
              permlink={post.permlink}
              currentUser={username || null}
              hiveValue={hiveValue}
              onUpvote={(percent) => handleUpvote(post.author, post.permlink, percent)}
              onSubmitComment={(parentAuthor, parentPermlink, body) =>
                handleComment(parentAuthor, parentPermlink, body)
              }
              onComments={() => {}}
              onReblog={handleReblog}
              onShare={handleShare}
              onTip={handleTip}
              onReport={handleReport}
              onClickCommentUpvote={(author, permlink, percent) =>
                handleUpvote(author, permlink, percent)
              }
            />
          </div>
        </div>
      </div>
    </article>
  )
}
