/**
 * User profile page: wraps hive-react-kit's UserDetailProfile with
 * app-specific navigation callbacks, tokens, and follow/unfollow logic.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserDetailProfile } from 'hive-react-kit'
import { useAuthData } from '../stores/authStore'

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
  const { username: currentUsername, ecencyToken } = useAuthData()

  const giphyApiKey = import.meta.env.VITE_GIPHY_KEY || undefined
  const threeSpeakApiKey = import.meta.env.VITE_3SPEAK_API_KEY || undefined

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
