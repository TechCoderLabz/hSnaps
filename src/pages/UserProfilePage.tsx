/**
 * User profile page: wraps hive-react-kit's UserDetailProfile with
 * app-specific navigation callbacks, tokens, and follow/unfollow logic.
 */
import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAioha } from '@aioha/react-provider'
import { KeyTypes } from '@aioha/aioha'
import { UserDetailProfile } from 'hive-react-kit'
import { toast } from 'sonner'
import { useAuthStore } from 'hive-authentication'
import { useAuthData } from '../stores/authStore'
import { useReportedPostsStore } from '../stores/reportedPostsStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useHiveOperations } from '../hooks/useHiveOperations'
import { isIOS, isMobilePlatform, getShareBaseUrl } from '../utils/platform-detection'

/** Catches render errors from UserDetailProfile so the whole app doesn't crash. */
class ProfileErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[UserProfilePage] render error:', error, info)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export function UserProfilePage() {
  const params = useParams<{ username: string }>()
  const rawUsername = params.username ?? ''
  const profileUsername = rawUsername.startsWith('@')
    ? rawUsername.slice(1)
    : rawUsername

  const navigate = useNavigate()
  const { aioha } = useAioha()
  const { isAuthenticated, username: currentUsername, ecencyToken, token } = useAuthData()
  const { vote, comment } = useHiveOperations()
  const haAuthStore = useAuthStore()

  const [showTipDialog, setShowTipDialog] = useState(false)
  const [tipTarget, setTipTarget] = useState<{ author: string; permlink: string } | null>(null)
  const [tipAmount, setTipAmount] = useState('')
  const [tipToken, setTipToken] = useState<'HIVE' | 'HBD'>('HIVE')
  const [tipSubmitting, setTipSubmitting] = useState(false)
  const [tipError, setTipError] = useState<string | null>(null)

  const reportedPostsStore = useReportedPostsStore()
  const ignoredAuthors = useIgnoredAuthorsStore((s) => s.list)
  const addIgnoredAuthor = useIgnoredAuthorsStore((s) => s.addAuthor)

  const giphyApiKey = import.meta.env.VITE_GIPHY_KEY || undefined
  const threeSpeakApiKey = import.meta.env.VITE_3SPEAK_API_KEY || undefined

  // Fetch reported posts on mount when authenticated
  useEffect(() => {
    if (token) {
      reportedPostsStore.fetchReportedPosts(token)
    }
  }, [token])

  const handleSubmitTip = async () => {
    // if (!isAuthenticated || !aioha?.isLoggedIn()) {
    //   toast.error('Please login to send a tip')
    //   return
    // }
    await haAuthStore.switchToPostingForCurrentUser();
    const parsed = Number.parseFloat(tipAmount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setTipError('Enter a valid amount greater than 0.')
      return
    }
    const tipAuthor = tipTarget?.author ?? ''
    const tipPermlink = tipTarget?.permlink ?? ''
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

  if (!profileUsername) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#212529] text-[#9ca3b0]">
        <p>No username provided.</p>
      </div>
    )
  }

  const errorFallback = (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#212529] text-[#f0f0f8]">
      <p className="text-[#9ca3b0]">Failed to load profile for @{profileUsername}</p>
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
    <div className={`flex h-screen flex-col overflow-hidden bg-[#212529] text-[#f0f0f8] ${isMobilePlatform() ? 'mobile-safe-area-top' : ''}`}>
      <ProfileErrorBoundary fallback={errorFallback}>
        <UserDetailProfile
          username={profileUsername}
          currentUsername={currentUsername || undefined}
          showBackButton
          ecencyToken={ecencyToken}
          threeSpeakApiKey={threeSpeakApiKey}
          giphyApiKey={giphyApiKey}
          reportedPosts={reportedPostsStore.reportedPosts}
          reportedAuthors={ignoredAuthors}
          onReportUser={async (user: string, reason: string) => {
            if (!token) { toast.error('Please login to report'); return }
            try {
              const res = await fetch('https://hreplier-api.sagarkothari88.one/report-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify({ username: user, reason }),
              })
              if (!res.ok) throw new Error(`Report failed (${res.status})`)
              await addIgnoredAuthor(token, user)
              toast.success(`Reported @${user}`)
            } catch (e) { toast.error(e instanceof Error ? e.message : 'Report failed') }
          }}
          onReportPost={async (author: string, permlink: string, reason: string) => {
            if (!token) { toast.error('Please login to report'); return }
            try {
              const res = await fetch('https://hreplier-api.sagarkothari88.one/report-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify({ username: author, permlink, reason }),
              })
              if (!res.ok) throw new Error(`Report failed (${res.status})`)
              reportedPostsStore.addReportedPost(author, permlink)
              toast.success(`Reported post by @${author}`)
            } catch (e) { toast.error(e instanceof Error ? e.message : 'Report failed') }
          }}
          tabShown={[
            'blogs',
            'posts',
            'snaps',
            'polls',
            'comments',
            'replies',
            'activities',
            'followers',
            'following',
            'wallet',
          ]}
          templateToken={token}
          templateApiBaseUrl={import.meta.env.VITE_TEMPLATE_API_BASE_URL || 'https://hreplier-api.sagarkothari88.one/data/templates'}
          onUpvote={async (author, permlink, percent) => {
            try {
              await haAuthStore.switchToPostingForCurrentUser()
              await vote(author, permlink, percent)
              toast.success('Post upvoted')
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Vote failed'
              if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('reject')) throw e
              toast.info('Vote cancelled')
            }
          }}
          onSubmitComment={async (parentAuthor, parentPermlink, body) => {
            try {
              await haAuthStore.switchToPostingForCurrentUser()
              await comment(parentAuthor, parentPermlink, body)
              toast.success('Comment posted')
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Comment failed'
              if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('reject')) {
                toast.info('Comment cancelled')
              } else {
                throw e
              }
            }
          }}
          onClickCommentUpvote={async (author, permlink, percent) => {
            try {
              await haAuthStore.switchToPostingForCurrentUser()
              await vote(author, permlink, percent)
              toast.success('Comment upvoted')
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Vote failed'
              if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('reject')) throw e
              toast.info('Vote cancelled')
            }
          }}
          onBack={() => {
            const prev = sessionStorage.getItem('hsnaps_prev_route')
            if (prev) {
              navigate(prev)
              sessionStorage.removeItem('hsnaps_prev_route')
            } else {
              navigate('/dashboard')
            }
          }}
          onTip={isIOS() ? undefined : (author, permlink) => async () => {
            await haAuthStore.switchToPostingForCurrentUser()
            setTipError(null)
            setTipAmount('')
            setTipToken('HIVE')
            setTipTarget({ author, permlink })
            setShowTipDialog(true)
          }}
          onCommentClick={(author, permlink) => {
            navigate(`/post/${author}/${permlink}`)
          }}
          onPostClick={(author, permlink) => {
            navigate(`/post/${author}/${permlink}`)
          }}
          onSnapClick={(author, permlink) => {
            navigate(`/post/${author}/${permlink}`)
          }}
          onPollClick={(author, permlink) => {
            navigate(`/post/${author}/${permlink}`)
          }}
          onUserClick={(user) => {
            navigate(`/user/${user}`)
          }}
          onActivityPermlink={(author, permlink) => {
            navigate(`/post/${author}/${permlink}`)
          }}
          onShare={async () => {
            const url = `${getShareBaseUrl()}/#/user/${profileUsername}`
            try {
              if (!isMobilePlatform() && navigator.share) {
                await navigator.share({ url, title: `Profile of @${profileUsername}` })
                toast.success('Link shared')
              } else {
                await navigator.clipboard.writeText(url)
                toast.success('Link copied')
              }
            } catch {
              // toast.error('Could not share link')
              console.error('Share failed')
            }
          }}
        />

        {/* Tip dialog — hidden on iOS (Apple IAP policy) */}
        {showTipDialog && !isIOS() && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-[#3a424a] bg-[#262b30] p-5 shadow-2xl">
              <h3 className="text-lg font-semibold text-white">Send tip</h3>
              <p className="mt-1 text-sm text-[#9ca3b0]">
                Send tip to @{tipTarget?.author}
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
      </ProfileErrorBoundary>
    </div>
  )
}
