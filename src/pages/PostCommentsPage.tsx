/**
 * Post detail page: wraps hive-react-kit's HiveDetailPost with
 * app-specific navigation callbacks, report flow, tip dialog, and Hive blockchain operations.
 */
import { Component, type ErrorInfo, type ReactNode, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAioha } from '@aioha/react-ui'
import { KeyTypes } from '@aioha/aioha'
import { HiveDetailPost } from 'hive-react-kit'
import { ReportModal, useAuthStore } from 'hive-authentication'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useReportedPostsStore } from '../stores/reportedPostsStore'
import { useHiveOperations, stripAppSuffix } from '../hooks/useHiveOperations'
import { useComposerSettingsStore } from '../stores/composerSettingsStore'
import { isIOS, isMobilePlatform, getShareBaseUrl } from '../utils/platform-detection'

const REPORT_API_URL = 'https://hreplier-api.sagarkothari88.one/report-post'

/** Strip the shared "via Apps from" footer before the body is rendered. */
function processPostBody(body: string): string {
  return stripAppSuffix(body)
}

/** Catches render errors so the whole app doesn't crash. */
class PostErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PostCommentsPage] render error:', error, info)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export function PostCommentsPage() {
  const { author, permlink } = useParams()
  const navigate = useNavigate()
  const { aioha } = useAioha()
  const { isAuthenticated, username: currentUsername, ecencyToken, token } = useAuthData()
  const { comment, vote, voteAndComment } = useHiveOperations()
  const defaultReward = useComposerSettingsStore((s) => s.defaultReward)
  const haAuthStore = useAuthStore()
  const addIgnoredAuthor = useIgnoredAuthorsStore((s) => s.addAuthor)
  const ignoredAuthors = useIgnoredAuthorsStore((s) => s.list)
  const reportedPostsStore = useReportedPostsStore()
  const [reportOpen, setReportOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ author: string; permlink: string } | null>(null)
  const [showTipDialog, setShowTipDialog] = useState(false)
  const [tipTarget, setTipTarget] = useState<{ author: string; permlink: string } | null>(null)
  const [tipAmount, setTipAmount] = useState('')
  const [tipToken, setTipToken] = useState<'HIVE' | 'HBD'>('HIVE')
  const [tipSubmitting, setTipSubmitting] = useState(false)
  const [tipError, setTipError] = useState<string | null>(null)

  const resolvedAuthor = (author ?? '').replace(/^@/, '')
  const resolvedPermlink = permlink ?? ''

  if (!resolvedAuthor || !resolvedPermlink) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Invalid route. Missing post author/permlink.
      </div>
    )
  }

  const handleOpenTip = () => async () => {
    await haAuthStore.switchToPostingForCurrentUser()
    // if (!isAuthenticated || !aioha?.isLoggedIn()) {
    //   toast.error('Please login to send a tip')
    //   return
    // }
    setTipError(null)
    setTipAmount('')
    setTipToken('HIVE')
    setTipTarget({ author: resolvedAuthor, permlink: resolvedPermlink })
    setShowTipDialog(true)
  }

  const handleSubmitTip = async () => {
    await haAuthStore.switchToPostingForCurrentUser()
    // if (!isAuthenticated || !aioha?.isLoggedIn()) {
    //   toast.error('Please login to send a tip')
    //   return
    // }
    const parsed = Number.parseFloat(tipAmount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setTipError('Enter a valid amount greater than 0.')
      return
    }
    const tipAuthor = tipTarget?.author ?? resolvedAuthor
    const tipPermlink = tipTarget?.permlink ?? resolvedPermlink
    setTipSubmitting(true)
    setTipError(null)
    try {
      const amount = `${parsed.toFixed(3)} ${tipToken}`
      await haAuthStore.switchToPostingForCurrentUser()
      const result = await aioha.signAndBroadcastTx(
        [[
          'transfer',
          {
            from: currentUsername,
            to: tipAuthor,
            amount,
            memo: `!tip @${tipAuthor}/${tipPermlink} @${currentUsername} app:hsnaps message:Tip sent through hSnaps`,
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

  const handleReport = async (reason: string) => {
    if (!token?.trim()) {
      toast.error('Please log in to report')
      setReportOpen(false)
      return
    }
    const rAuthor = reportTarget?.author ?? resolvedAuthor
    const rPermlink = reportTarget?.permlink ?? resolvedPermlink
    try {
      const res = await fetch(REPORT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          username: rAuthor,
          permlink: rPermlink,
          reason,
        }),
      })
      if (!res.ok) throw new Error(`Report failed (${res.status})`)
      reportedPostsStore.addReportedPost(rAuthor, rPermlink)
      await addIgnoredAuthor(token, rAuthor)
      toast.success('Reported and author ignored')
      setReportOpen(false)
      setReportTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to report')
    }
  }

  const errorFallback = (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-[#f0f0f8]">
      <p className="text-[#9ca3b0]">Failed to load post by @{resolvedAuthor}</p>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="rounded-lg border border-[#3a424a] bg-[#262b30] px-4 py-2 text-sm text-[#f0f0f8] hover:bg-[#2f353d]"
      >
        Back to Dashboard
      </button>
    </div>
  )

  return (
    <div className={`h-screen overflow-hidden ${isMobilePlatform() ? 'mobile-safe-area-top' : ''}`}>
    <PostErrorBoundary fallback={errorFallback}>
      <HiveDetailPost
        author={resolvedAuthor}
        permlink={resolvedPermlink}
        currentUser={currentUsername || undefined}
        ecencyToken={ecencyToken}
        templateToken={token}
        templateApiBaseUrl={import.meta.env.VITE_TEMPLATE_API_BASE_URL || 'https://hreplier-api.sagarkothari88.one/data/templates'}
        threeSpeakApiKey={import.meta.env.VITE_3SPEAK_API_KEY}
        giphyApiKey={import.meta.env.VITE_GIPHY_KEY}
        reportedAuthors={ignoredAuthors}
        reportedPosts={reportedPostsStore.reportedPosts}
        onBack={() => navigate(-1)}
        onNavigateToPost={(a, p) => navigate(`/@${a}/${p}`)}
        onUserClick={(user) => navigate(`/@${user}`)}
        onReport={() => { setReportTarget(null); setReportOpen(true) }}
        onTip={isIOS() ? undefined : handleOpenTip}
        onUpvote={async (percent) => {
          try {
            await vote(resolvedAuthor, resolvedPermlink, percent)
            toast.success('Post upvoted')
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Vote failed'
            if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('reject')) {
              toast.info('Vote cancelled')
            } else {
              throw e
            }
          }
        }}
        showVoteButton
        processBody={processPostBody}
        defaultReward={defaultReward}
        onSubmitComment={async (parentAuthor, parentPermlink, body, voteWeight) => {
          try {
            if (typeof voteWeight === 'number') {
              await voteAndComment(parentAuthor, parentPermlink, voteWeight, body, undefined, undefined, defaultReward)
              toast.success('Comment posted & upvoted')
            } else {
              await comment(parentAuthor, parentPermlink, body, undefined, undefined, defaultReward)
              toast.success('Comment posted')
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Comment failed'
            if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('reject')) {
              toast.info('Comment cancelled')
              return false // signal cancellation — preserves composer text
            } else {
              throw e
            }
          }
        }}
        onClickCommentUpvote={async (cAuthor, cPermlink, percent) => {
          try {
            await vote(cAuthor, cPermlink, percent)
            toast.success('Comment upvoted')
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Vote failed'
            if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('reject')) {
              toast.info('Vote cancelled')
            } else {
              throw e
            }
          }
        }}
        onReblog={async () => {
          if (!aioha?.isLoggedIn()) { toast.error('Please login to reblog'); return }
          try {
            await haAuthStore.switchToPostingForCurrentUser()
            const result = await aioha.reblog(resolvedAuthor, resolvedPermlink, false)
            if (result?.success) toast.success('Reblogged successfully')
            else throw new Error((result as any)?.error || 'Reblog failed')
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Reblog failed'
            if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('reject')) toast.error(msg)
          }
        }}
        onShare={async () => {
          const url = `${getShareBaseUrl()}/#/@${resolvedAuthor}/${resolvedPermlink}`
          try {
            if (!isMobilePlatform() && navigator.share) {
              await navigator.share({ url, title: `Post by @${resolvedAuthor}` })
              toast.success('Link shared')
            } else {
              await navigator.clipboard.writeText(url)
              toast.success('Post link copied')
            }
          } catch {
            // toast.error('Could not share link')
            console.log('Share failed')
          }
        }}
        onVotePoll={async (pollAuthor, pollPermlink, choiceNums) => {
          // if (!aioha?.isLoggedIn()) { toast.error('Please login to vote'); return }
          try {
            await haAuthStore.switchToPostingForCurrentUser()
            const result = await aioha.customJSON(
              KeyTypes.Posting,
              'polls',
              { poll: `${pollAuthor}/${pollPermlink}`, action: 'vote', choices: choiceNums },
              'Poll Vote'
            )
            if (result?.success) toast.success('Poll vote submitted')
            else throw new Error((result as any)?.error || 'Poll vote failed')
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Poll vote failed'
            if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('reject')) {
              toast.info('Poll vote cancelled')
              return false // signal cancellation — don't mark as voted
            }
            toast.error(msg)
            return false
          }
        }}
        onShareComment={async (cAuthor, cPermlink) => {
          const url = `${getShareBaseUrl()}/#/@${cAuthor}/${cPermlink}`
          try {
            if (!isMobilePlatform() && navigator.share) {
              await navigator.share({ url, title: `Comment by @${cAuthor}` })
              toast.success('Link shared')
            } else {
              await navigator.clipboard.writeText(url)
              toast.success('Comment link copied')
            }
          } catch {
            // toast.error('Could not share link')
            console.log('Share failed')
          }
        }}
        onTipComment={isIOS() ? undefined : (cAuthor: string, _cPermlink: string) => {
          if (!isAuthenticated || !aioha?.isLoggedIn()) { toast.error('Please login to send a tip'); return }
          setTipError(null)
          setTipAmount('')
          setTipToken('HIVE')
          setTipTarget({ author: cAuthor, permlink: _cPermlink })
          setShowTipDialog(true)
        }}
        onReportComment={(cAuthor, cPermlink) => {
          setReportTarget({ author: cAuthor, permlink: cPermlink })
          setReportOpen(true)
        }}
      />

      {/* Report modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => { setReportOpen(false); setReportTarget(null) }}
        onReport={handleReport}
        reportType="post"
        targetUsername={reportTarget?.author ?? resolvedAuthor}
        targetPermlink={reportTarget?.permlink ?? resolvedPermlink}
      />

      {/* Tip dialog — hidden on iOS (Apple IAP policy) */}
      {showTipDialog && !isIOS() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#3a424a] bg-[#262b30] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Send tip</h3>
            <p className="mt-1 text-sm text-[#9ca3b0]">
              Send tip to @{tipTarget?.author ?? resolvedAuthor}
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
    </PostErrorBoundary>
    </div>
  )
}
