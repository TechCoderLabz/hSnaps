/**
 * Post detail page: wraps hive-react-kit's HiveDetailPost with
 * app-specific navigation callbacks, report flow, tip dialog, and Hive blockchain operations.
 */
import { Component, type ErrorInfo, type ReactNode, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAioha } from '@aioha/react-provider'
import { KeyTypes } from '@aioha/aioha'
import { HiveDetailPost } from 'hive-react-kit'
import { ReportModal } from 'hive-authentication'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useHiveOperations } from '../hooks/useHiveOperations'

const REPORT_API_URL = 'https://hreplier-api.sagarkothari88.one/report-post'

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
  const { comment, vote } = useHiveOperations()
  const addIgnoredAuthor = useIgnoredAuthorsStore((s) => s.addAuthor)
  const [reportOpen, setReportOpen] = useState(false)
  const [showTipDialog, setShowTipDialog] = useState(false)
  const [tipAmount, setTipAmount] = useState('')
  const [tipToken, setTipToken] = useState<'HIVE' | 'HBD'>('HIVE')
  const [tipSubmitting, setTipSubmitting] = useState(false)
  const [tipError, setTipError] = useState<string | null>(null)

  const resolvedAuthor = author ?? ''
  const resolvedPermlink = permlink ?? ''

  if (!resolvedAuthor || !resolvedPermlink) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Invalid route. Missing post author/permlink.
      </div>
    )
  }

  const handleOpenTip = () => {
    if (!isAuthenticated || !aioha?.isLoggedIn()) {
      toast.error('Please login to send a tip')
      return
    }
    setTipError(null)
    setTipAmount('')
    setTipToken('HIVE')
    setShowTipDialog(true)
  }

  const handleSubmitTip = async () => {
    if (!isAuthenticated || !aioha?.isLoggedIn()) {
      toast.error('Please login to send a tip')
      return
    }
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
            from: currentUsername,
            to: resolvedAuthor,
            amount,
            memo: `!tip @${resolvedAuthor}/${resolvedPermlink} @${currentUsername} app:hsnaps message:Tip sent through hSnaps`,
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
    try {
      const res = await fetch(REPORT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          username: resolvedAuthor,
          permlink: resolvedPermlink,
          reason,
        }),
      })
      if (!res.ok) throw new Error(`Report failed (${res.status})`)
      await addIgnoredAuthor(token, resolvedAuthor)
      toast.success('Post reported and author ignored')
      setReportOpen(false)
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to report post')
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
    <PostErrorBoundary fallback={errorFallback}>
      <HiveDetailPost
        author={resolvedAuthor}
        permlink={resolvedPermlink}
        currentUser={currentUsername || undefined}
        ecencyToken={ecencyToken}
        onBack={() => navigate(-1)}
        onUserClick={(user) => navigate(`/user/${user}`)}
        onReport={() => setReportOpen(true)}
        onTip={handleOpenTip}
        onSubmitComment={async (parentAuthor, parentPermlink, body) => {
          await comment(parentAuthor, parentPermlink, body)
          toast.success('Comment posted')
        }}
        onClickCommentUpvote={async (cAuthor, cPermlink, percent) => {
          await vote(cAuthor, cPermlink, percent)
          toast.success('Comment upvoted')
        }}
      />

      {/* Report modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onReport={handleReport}
        reportType="post"
        targetUsername={resolvedAuthor}
        targetPermlink={resolvedPermlink}
      />

      {/* Tip dialog */}
      {showTipDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#3a424a] bg-[#262b30] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Send tip</h3>
            <p className="mt-1 text-sm text-[#9ca3b0]">
              Send tip to @{resolvedAuthor}
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
  )
}
