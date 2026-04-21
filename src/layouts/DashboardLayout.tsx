/**
 * Dashboard layout: drawer menu, header, main content.
 * Safe area 20px top for native iOS/Android. Mobile: no feed switcher in app bar (use drawer). Load/refresh ignored authors on login and user switch.
 */
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuthStore as useHiveAuthStore } from 'hive-authentication'
import { AppHeader } from '../components/AppHeader'
import { AppDrawer } from '../components/AppDrawer'
import { HiveLoginButton } from '../components/HiveLoginButton'
import { FeedFilterDropdown } from '../components/FeedFilterDropdown'
import { RefreshFeedsButton } from '../components/RefreshFeedsButton'
import { useFeedColumnCount } from '../hooks/useFeedColumnCount'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useFeedFilterStore } from '../stores/feedFilterStore'
import { useFollowingStore } from '../stores/followingStore'
import { useAuthData } from '../stores/authStore'
import { useUserCommentsStore } from '../stores/userCommentsStore'

export function DashboardLayout() {
  const location = useLocation()
  const columns = useFeedColumnCount()
  const isMobileView = columns === 1
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { token, username } = useAuthData()
  const fetchIgnoredList = useIgnoredAuthorsStore((s) => s.fetchList)
  const setIgnoredList = useIgnoredAuthorsStore((s) => s.setList)
  const clearUserComments = useUserCommentsStore((s) => s.clear)
  const prevTokenRef = useRef<string | null>(null)
  const previousUserRef = useRef<{ username: string } | null>(null)

  const hideFeedFilter =
    location.pathname.startsWith('/dashboard/settings') ||
    location.pathname.startsWith('/dashboard/search-user') ||
    location.pathname.startsWith('/post/') ||
    location.pathname.startsWith('/@')

  useEffect(() => {
    if (token) {
      const abortController = new AbortController()
      fetchIgnoredList(token, abortController.signal).catch(() => {})
      prevTokenRef.current = token
      return () => { abortController.abort('avoid duplicate requests') }
    } else {
      setIgnoredList([])
      prevTokenRef.current = null
    }
  }, [token, fetchIgnoredList, setIgnoredList])

  // Clear session-local comment marks on logout. The red comment icon in the
  // feed is driven by post.replies (already on each post) + current username;
  // the store only holds optimistic marks from replies made this session.
  useEffect(() => {
    if (!username) clearUserComments()
  }, [username, clearUserComments])

  // Handle login/logout/switch user: refetch ignored list (from package example snippet)
  useEffect(() => {
    const unsubscribe = useHiveAuthStore.subscribe((state) => {
      const currentUser = state.currentUser
      const previousUser = previousUserRef.current
      if (currentUser && !previousUser) {
        // User logged in
      } else if (!currentUser && previousUser) {
        // User logged out
        prevTokenRef.current = null
        useIgnoredAuthorsStore.getState().setList([])
        useFeedFilterStore.getState().setFeedFilter('newest')
        useFollowingStore.getState().reset()
      } else if (
        currentUser &&
        previousUser &&
        currentUser.username !== previousUser.username
      ) {
        // User switched: refetch ignored list and reset following for the new user
        useFollowingStore.getState().reset()
        try {
          const parsed = JSON.parse(currentUser.serverResponse) as Record<string, string>
          const currentToken = parsed?.token ?? null
          if (currentToken) {
            prevTokenRef.current = currentToken
            useIgnoredAuthorsStore.getState().fetchList(currentToken).catch(() => {})
          }
        } catch {
          // ignore
        }
      }
      previousUserRef.current = currentUser ? { username: currentUser.username } : null

      const currentToken = currentUser?.serverResponse
        ? (() => {
            try {
              const parsed = JSON.parse(currentUser.serverResponse) as Record<string, string>
              return parsed.token ?? null
            } catch {
              return null
            }
          })()
        : null
      if (currentToken && currentToken !== prevTokenRef.current) {
        prevTokenRef.current = currentToken
        useIgnoredAuthorsStore.getState().fetchList(currentToken).catch(() => {})
      }
    })
    return unsubscribe
  }, [])

  const headerRight = isMobileView ? (
    hideFeedFilter ? null : (
      <>
        <RefreshFeedsButton />
        <FeedFilterDropdown />
      </>
    )
  ) : (
    <>
      {!hideFeedFilter && (
        <>
          <RefreshFeedsButton />
          <FeedFilterDropdown />
        </>
      )}
      <HiveLoginButton />
    </>
  )

  const headerLeft = (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9ca3b0] hover:bg-[#2f353d] hover:text-[#f0f0f8]"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )

  return (
    <div
      className="flex min-h-screen flex-col bg-[#212529] text-[#f0f0f8]"
    >
      <AppHeader
        left={headerLeft}
        right={headerRight}
        className="sticky top-0 z-20 border-b border-[#3a424a] bg-[#212529]/95 py-0 sm:px-6"
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
        <div className="h-full min-h-0">
          <Outlet />
        </div>
      </main>
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isMobileView={isMobileView}
      />
    </div>
  )
}
