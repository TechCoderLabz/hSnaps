/**
 * User profile page: wraps hive-react-kit's UserDetailProfile with
 * app-specific navigation callbacks, tokens, and follow/unfollow logic.
 */
import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserDetailProfile } from 'hive-react-kit'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useReportedPostsStore } from '../stores/reportedPostsStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'

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
  const { username: currentUsername, ecencyToken, token } = useAuthData()

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
    <div className="flex min-h-screen flex-col bg-[#212529] text-[#f0f0f8]">
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
          onBack={() => {
            const prev = sessionStorage.getItem('hsnaps_prev_route')
            if (prev) {
              navigate(prev)
              sessionStorage.removeItem('hsnaps_prev_route')
            } else {
              navigate('/dashboard')
            }
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
          onShare={() => {
            const url = `${window.location.origin}/#/user/${profileUsername}`
            if (navigator.share) {
              void navigator.share({ url, title: `Profile of @${profileUsername}` })
            } else {
              void navigator.clipboard.writeText(url)
            }
          }}
        />
      </ProfileErrorBoundary>
    </div>
  )
}
