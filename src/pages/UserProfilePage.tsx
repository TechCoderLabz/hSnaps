import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAioha } from '@aioha/react-provider'
import { useProgrammaticAuth, ReportModal } from 'hive-authentication'
import { Share2, Flag, MoreVertical, User, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useFeedFilterStore } from '../stores/feedFilterStore'
import { useFeedByType } from '../hooks/useFeedByType'
import { useFollowingStore } from '../stores/followingStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { getFollowCount } from '../services/hiveService'
import { PostCard } from '../components/PostCard'
import { FeedSkeleton } from '../components/FeedSkeleton'

const HIVE_AVATAR = (username: string) =>
  `https://images.hive.blog/u/${username}/avatar`

interface ProfileState {
  isFollowing: boolean
  followerCount: number
  followingCount: number
}

export function UserProfilePage() {
  const params = useParams<{ username: string }>()
  const rawUsername = params.username ?? ''
  const profileUsername = rawUsername.startsWith('@')
    ? rawUsername.slice(1)
    : rawUsername

  const navigate = useNavigate()
  const { aioha } = useAioha()
  const { currentUser, username: currentUsername, token, isAuthenticated } = useAuthData()
  const { loginWithPrivateKey } = useProgrammaticAuth(aioha!)
  const setFeedFilter = useFeedFilterStore((s) => s.setFeedFilter)

  const fetchFollowings = useFollowingStore((s) => s.fetchFollowings)
  const isFollowingStore = useFollowingStore((s) => s.isFollowing)
  const addIgnoredAuthor = useIgnoredAuthorsStore((s) => s.addAuthor)

  const { posts, loading, error, hasMore, loadMore } = useFeedByType('snaps')

  const [profile, setProfile] = useState<ProfileState>({
    isFollowing: false,
    followerCount: 0,
    followingCount: 0,
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!currentUsername) return
    const abortController = new AbortController()
    fetchFollowings(currentUsername, abortController.signal).catch(() => {})
    return () => { abortController.abort('avoid duplicate requests') }
  }, [currentUsername, fetchFollowings])

  // On profile page we always want "Newest" filter, and no dropdown is shown in header.
  useEffect(() => {
    setFeedFilter('newest')
  }, [setFeedFilter])

  useEffect(() => {
    if (!profileUsername) return
    const abortController = new AbortController()
    const signal = abortController.signal
    setProfileLoading(true)
    ;(async () => {
      try {
        const counts = await getFollowCount(profileUsername, signal)
        if (signal.aborted) return
        const isFollowing = currentUsername
          ? isFollowingStore(profileUsername)
          : false
        setProfile({
          isFollowing,
          followerCount: counts.follower_count ?? 0,
          followingCount: counts.following_count ?? 0,
        })
      } catch (e) {
        if (signal.aborted) return
        setProfile((prev) => ({
          ...prev,
          isFollowing: currentUsername
            ? isFollowingStore(profileUsername)
            : false,
        }))
      } finally {
        if (!signal.aborted) setProfileLoading(false)
      }
    })()
    return () => {
      abortController.abort('avoid duplicate requests')
    }
  }, [profileUsername, currentUsername, isFollowingStore])

  const filteredPosts = useMemo(
    () =>
      posts.filter(
        (p) => p.author.toLowerCase() === profileUsername.toLowerCase()
      ),
    [posts, profileUsername]
  )

  const ensureProgrammaticAuth = async () => {
    const serverResponse = currentUser?.serverResponse
    if (!serverResponse) return
    try {
      const serverData = JSON.parse(serverResponse) as {
        privatePostingKey?: string
        token?: string
        ecencyToken?: string
      }
      if (!serverData.privatePostingKey || !currentUsername) return
      await loginWithPrivateKey(
        currentUsername,
        serverData.privatePostingKey,
        async () =>
          JSON.stringify({
            token: serverData.token,
            ecencyToken: serverData.ecencyToken,
            privatePostingKey: serverData.privatePostingKey,
          })
      )
    } catch {
      // ignore programmatic auth failure, wallet may still work interactively
    }
  }

  const handleFollow = async () => {
    setActionLoading(true)
    try {
      if (!currentUsername || !profileUsername) {
        throw new Error('User not authenticated')
      }
      if (!token) {
        throw new Error('Missing auth token')
      }
      if (!aioha) {
        throw new Error('Wallet not available')
      }

      const isCurrentlyFollowing =
        profile?.isFollowing ?? isFollowingStore(profileUsername)
      const shouldFollow = !isCurrentlyFollowing

      await ensureProgrammaticAuth()

      const result = await aioha.follow(profileUsername, isCurrentlyFollowing)
      if (!result || typeof result !== 'object' || !result.success) {
        const err = (result as { error?: string })?.error
        throw new Error(
          err || (shouldFollow ? 'Follow rejected' : 'Unfollow rejected')
        )
      }

      setProfile((prev) => ({
        ...prev,
        isFollowing: shouldFollow,
        followerCount:
          prev.followerCount + (shouldFollow ? 1 : prev.followerCount > 0 ? -1 : 0),
      }))

      toast.success(
        shouldFollow
          ? `Followed @${profileUsername}`
          : `Unfollowed @${profileUsername}`
      )

      setTimeout(() => {
        if (currentUsername) {
          fetchFollowings(currentUsername).catch(() => {})
        }
      }, 5000)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[UserProfilePage] Follow/Unfollow error:', error)
      const message =
        error instanceof Error ? error.message : 'Follow/Unfollow failed'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReportUser = async () => {
    if (!token?.trim()) {
      toast.error('Please log in to report')
      return
    }
    try {
      await addIgnoredAuthor(token, profileUsername)
      toast.success(`@${profileUsername} added to ignored list`)
      setReportModalOpen(false)
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add to ignored')
    }
  }

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/#/user/@${profileUsername}`
    try {
      if (navigator.share) {
        await navigator.share({
          url,
          title: `Profile of @${profileUsername}`,
        })
      } else {
        await navigator.clipboard.writeText(url)
      }
      toast.success('Profile link shared')
    } catch {
      toast.error('Could not share profile link')
    }
  }

  const isOwnProfile =
    currentUsername &&
    currentUsername.toLowerCase() === profileUsername.toLowerCase()

  return (
    <div className="flex min-h-screen flex-col bg-[#212529] text-[#f0f0f8]">
      <header className="sticky top-0 z-20 border-b border-[#3a424a] bg-[#212529]/95 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const prev = sessionStorage.getItem('hsnaps_prev_route')
                if (prev) {
                  navigate(prev)
                  sessionStorage.removeItem('hsnaps_prev_route')
                } else {
                  navigate('/dashboard')
                }
              }}
              className="inline-flex items-center rounded-lg px-2 py-1 text-xs text-[#9ca3b0] transition-colors hover:bg-[#3a424a] hover:text-[#f0f0f8]"
            >
              ← 
            </button>
            <img
              src={HIVE_AVATAR(profileUsername)}
              alt={profileUsername}
              onError={(e) => {
                e.currentTarget.src = HIVE_AVATAR('null')
              }}
              className="h-8 w-8 rounded-full border border-[#505863] object-cover sm:h-9 sm:w-9"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-[#ff8fa3] sm:text-lg">
                  @{profileUsername}
                </span>
                {isOwnProfile && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    You
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-[#9ca3b0]">
                <span>
                  <span className="font-semibold text-[#f0f0f8]">
                    {profile.followerCount}
                  </span>{' '}
                  Followers
                </span>
                <span>
                  <span className="font-semibold text-[#f0f0f8]">
                    {profile.followingCount}
                  </span>{' '}
                  Following
                </span>
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-lg border border-[#3a424a] bg-[#262b30] p-2 text-xs text-[#f0f0f8] hover:bg-[#2f353d]"
              aria-label="More actions"
              aria-expanded={moreOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[#3a424a] bg-[#262b30] py-1 shadow-xl">
                {isAuthenticated && !isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      void handleFollow()
                    }}
                    className= {`flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#f0f0f8] hover:bg-[#2f353d] ${profile.isFollowing ? 'text-red-500' : 'text-green-500'}`}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{profile.isFollowing ? 'Unfollow' : 'Follow'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    void handleShareProfile()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#f0f0f8] hover:bg-[#2f353d]"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share profile</span>
                </button>
                {isAuthenticated && !isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      setReportModalOpen(true)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#f97373] hover:bg-[#2f353d]"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Report user</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 px-3 py-3 sm:px-6 sm:py-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#9ca3b0]">
            Snaps from @{profileUsername}
          </h2>
          {error && (
            <div className="mb-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {(loading || profileLoading) && filteredPosts.length === 0 ? (
            [...Array(3)].map((_, i) => <FeedSkeleton key={i} />)
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl bg-[#262b30] px-4 py-8 text-center text-[#9ca3b0]">
              No snaps from @{profileUsername} yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={`${post.author}/${post.permlink}`}
                  post={post}
                  readOnly={!isAuthenticated}
                />
              ))}
              {hasMore && (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => loadMore()}
                    disabled={loading}
                    className="rounded-xl border border-[#3a424a] bg-[#262b30] px-4 py-2 text-sm text-[#9ca3b0] transition-colors hover:bg-[#2f353d] hover:text-[#f0f0f8] disabled:opacity-50"
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onReport={handleReportUser}
          reportType="post"
          targetUsername={profileUsername}
          targetPermlink=""
        />
      </main>
    </div>
  )
}

