/**
 * Dashboard layout: two views chosen by screen size (ternary).
 * - Desktop (≥ 1024px): sidebar tab switcher.
 * - Mobile (< 1024px): bottom nav bar.
 */
import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTrendingStore } from '../stores/trendingStore'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { AppHeader } from '../components/AppHeader'
import { HiveLoginButton } from '../components/HiveLoginButton'
import type { FeedType } from '../utils/types'

const SIDEBAR_TABS: { id: FeedType; label: string; subLabel: string; path: string }[] = [
  { id: 'snaps', label: 'Snaps', subLabel: 'BY @PEAKD', path: '/dashboard/snaps' },
  { id: 'threads', label: 'Threads', subLabel: 'BY @INLEO', path: '/dashboard/threads' },
  { id: 'waves', label: 'Waves', subLabel: 'BY @ECENCY', path: '/dashboard/waves' },
  { id: 'dbuzz', label: 'DBuzz', subLabel: 'BY @DBUZZ', path: '/dashboard/dbuzz' },
  { id: 'moment', label: 'Moments', subLabel: 'BY @LIKETU', path: '/dashboard/moment' },
]

const PATH_TO_FEED: Record<string, FeedType> = {
  '/dashboard/snaps': 'snaps',
  '/dashboard/threads': 'threads',
  '/dashboard/waves': 'waves',
  '/dashboard/dbuzz': 'dbuzz',
  '/dashboard/moment': 'moment',
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const feedType = PATH_TO_FEED[location.pathname]
  const { tags, authors, communities, loading, fetchTrending } = useTrendingStore()

  useEffect(() => {
    if (feedType) void fetchTrending(feedType)
  }, [feedType, fetchTrending])

  return (
    <div className="min-h-screen bg-[#212529] text-[#f0f0f8] flex flex-col">
      <AppHeader
        className="sticky top-0 z-20 h-14 border-b border-[#3a424a] bg-[#212529]/95 py-0 sm:px-6"
        right={<HiveLoginButton />}
      />

      {isDesktop ? (
        <DesktopView
          location={location}
          navigate={navigate}
          feedType={feedType}
          tags={tags}
          authors={authors}
          communities={communities}
          loading={loading}
        />
      ) : (
        <MobileView location={location} navigate={navigate} />
      )}
    </div>
  )
}

/** Desktop view: sidebar tab switcher + main content. No bottom nav. */
function DesktopView({
  location,
  navigate,
  feedType,
  tags,
  authors,
  communities,
  loading,
}: {
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
  feedType: FeedType | undefined
  tags: { tag: string; posts: number }[]
  authors: { author: string; posts: number }[]
  communities: { tag: string; posts: number }[]
  loading: boolean
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-[#3a424a] bg-[#1a1e23] overflow-y-auto">
        <nav className="sticky top-14 flex flex-col gap-2 p-3 flex-1">
          {SIDEBAR_TABS.map((tab) => {
            const isActive = location.pathname === tab.path
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.path)}
                className={`relative rounded-lg border px-4 py-3.5 text-left transition-colors ${
                  isActive
                    ? 'border-[#e31337] bg-[#e31337]/15 text-[#f0f0f8] shadow-[0_0_0_1px_rgba(227,19,55,0.45)]'
                    : 'border-[#2d333b] bg-[#22272e] text-[#e7e7f1] hover:border-[#454c56] hover:bg-[#2d333b]'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-0 w-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-[#e31337]"
                    aria-hidden
                  />
                )}
                <div className="text-xl font-bold uppercase tracking-tight pr-6">
                  {tab.label}
                </div>
                <div className={`mt-0.5 text-[10px] uppercase tracking-wider ${isActive ? 'text-[#ffd0d9]' : 'text-[#8b949e]'}`}>
                  {tab.subLabel}
                </div>
              </button>
            )
          })}
          {feedType && (
            <div className="mt-4 space-y-4 border-t border-[#3a424a] pt-4">
              <section>
                <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3b0]">
                  Top Tags
                </h3>
                {loading ? (
                  <p className="mt-2 px-2 text-xs text-[#9ca3b0]">Loading…</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {tags.slice(0, 10).map((t) => (
                      <li key={t.tag}>
                        <span className="block rounded-lg px-3 py-1.5 text-xs text-[#e7e7f1] hover:bg-[#2f353d]">
                          #{t.tag} <span className="text-[#9ca3b0]">({t.posts})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3b0]">
                  Top Users
                </h3>
                {loading ? (
                  <p className="mt-2 px-2 text-xs text-[#9ca3b0]">Loading…</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {authors.slice(0, 10).map((a) => (
                      <li key={a.author}>
                        <span className="block rounded-lg px-3 py-1.5 text-xs text-[#e7e7f1] hover:bg-[#2f353d]">
                          @{a.author} <span className="text-[#9ca3b0]">({a.posts})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3b0]">
                  Top Communities
                </h3>
                {loading ? (
                  <p className="mt-2 px-2 text-xs text-[#9ca3b0]">Loading…</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {communities.slice(0, 8).map((c) => (
                      <li key={c.tag}>
                        <span className="block rounded-lg px-3 py-1.5 text-xs text-[#e7e7f1] hover:bg-[#2f353d]">
                          {c.tag} <span className="text-[#9ca3b0]">({c.posts})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-4 pl-6">
        <Outlet />
      </main>
    </div>
  )
}

/** Mobile view: main content + fixed bottom nav bar. No sidebar. */
function MobileView({
  location,
  navigate,
}: {
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1280px] flex-1">
        <main className="flex-1 overflow-auto p-4 pb-24">
          <Outlet />
        </main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-[#3a424a] bg-[#212529]/95 py-2 backdrop-blur">
        {SIDEBAR_TABS.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs border-t-2 ${
                isActive
                  ? 'text-[#e31337] border-[#e31337]'
                  : 'text-[#9ca3b0] border-transparent'
              }`}
            >
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
