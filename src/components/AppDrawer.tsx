/**
 * App drawer: menu items (feed options on mobile, Search User, Bookmarks, Ignored, Settings, Login on mobile).
 * Bottom: branch, app version, refresh (web) or copy version (native).
 */
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  Bookmark,
  EyeOff,
  Settings,
  RefreshCw,
  Copy,
  X,
  Home,
  ShieldCheck,
  ShieldAlert,
  Info,
  User,
} from 'lucide-react'
import { useMobileFeedStore } from '../stores/mobileFeedStore'
import { isMobilePlatform } from '../utils/platform-detection'
import { APP_VERSION, APP_BRANCH, APP_COMMIT_HASH } from '../config/appVersion'
import { HiveLoginButton } from './HiveLoginButton'
import { AppLogo } from './AppLogo'
import { useAuthData } from '../stores/authStore'
import type { UnifiedFeedType } from '../hooks/useFeedByType'
import { FEED_LABELS, FEED_AVATARS } from '../constants/feeds'
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  APP_STORE_LOGO,
  PLAY_STORE_LOGO,
} from '../constants/appStores'
import { toast } from 'sonner'

const MOBILE_FEED_IDS: UnifiedFeedType[] = ['snaps', 'waves', 'threads', 'moments']

interface AppDrawerProps {
  open: boolean
  onClose: () => void
  /** True when viewport is single column (mobile). */
  isMobileView: boolean
}

export function AppDrawer({ open, onClose, isMobileView }: AppDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { feedType, setFeedType } = useMobileFeedStore()
  const isNative = isMobilePlatform()
  const { isAuthenticated, username, isApprover } = useAuthData()

  // Home is active whenever a feed is showing (snaps, waves, threads, moments, ecency, etc.),
  // which is anything rendered at the /dashboard index route.
  const isHomeActive = location.pathname === '/dashboard'

  const itemClasses = (active: boolean) =>
    `flex w-full items-center gap-3 px-4 py-2.5 text-left ${
      active ? 'bg-[#2f353d] text-[#e31337]' : 'text-[#f0f0f8] hover:bg-[#2f353d]'
    }`
  const iconClasses = (active: boolean) =>
    `h-5 w-5 shrink-0 ${active ? 'text-[#e31337]' : 'text-[#9ca3b0]'}`
  const isActive = (path: string) => location.pathname === path

  const handleNav = (path: string) => {
    navigate(path.startsWith('/') ? path : `/dashboard/${path}`)
    onClose()
  }

  const handleFeedChange = (id: string) => {
    setFeedType(id as UnifiedFeedType)
    navigate('/dashboard')
    onClose()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleCopyVersion = async () => {
    try {
      const text = APP_COMMIT_HASH
        ? `${APP_VERSION} (${APP_BRANCH} · ${APP_COMMIT_HASH})`
        : `${APP_VERSION} (${APP_BRANCH})`
      await navigator.clipboard.writeText(text)
      toast.success('Version copied')
    } catch {
      toast.error('Copy failed')
    }
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="app-header-safe-area fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-[#3a424a] bg-[#212529] shadow-xl"
        role="dialog"
        aria-label="Menu"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#3a424a] px-4">
          <div className="flex items-center gap-2">
            <AppLogo />
            <span className="text-xl font-semibold bg-gradient-to-r from-[#f0f0f8] via-[#e7e7f1] to-[#ff7a92] bg-clip-text text-transparent">
              hSnaps
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9ca3b0] hover:bg-[#2f353d] hover:text-[#f0f0f8]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {isMobileView && (
          <div className="px-3 py-3 mx-auto">
            <HiveLoginButton />
          </div>
        )}

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
          <div className="pb-2">
            <button
              type="button"
              onClick={() => handleNav('/dashboard')}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${isHomeActive ? 'bg-[#2f353d] text-[#e31337]' : 'text-[#f0f0f8] hover:bg-[#2f353d]'
                }`}
            >
              <Home
                className={`h-5 w-5 shrink-0 ${isHomeActive ? 'text-[#e31337]' : 'text-[#9ca3b0]'}`}
              />
              <span>Home</span>
            </button>
          </div>

          {isMobileView && (
            <div className="pb-2">
              <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-[#9ca3b0]">
                Feed
              </p>
              {MOBILE_FEED_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleFeedChange(id)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                    isHomeActive && feedType === id
                      ? 'bg-[#2f353d] text-[#e31337]'
                      : 'text-[#f0f0f8] hover:bg-[#2f353d]'
                  }`}
                >
                  <img
                    src={FEED_AVATARS[id]}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full bg-[#2f353d] object-cover ring-1 ring-[#3a424a]"
                  />
                  <span>{FEED_LABELS[id]}</span>
                </button>
              ))}
            </div>
          )}

          <div className={`pt-3 ${isMobileView ? 'border-t border-[#3a424a]' : ''}`}>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-[#9ca3b0]">
              App
            </p>
            <ul className="space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/search-user')}
                  className={itemClasses(isActive('/dashboard/search-user'))}
                >
                  <Search className={iconClasses(isActive('/dashboard/search-user'))} />
                  <span>Search User</span>
                </button>
              </li>
              {isAuthenticated && username && (
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav(`/@${username}`)}
                    className={itemClasses(isActive(`/@${username}`))}
                  >
                    <User className={iconClasses(isActive(`/@${username}`))} />
                    <span>My Profile</span>
                  </button>
                </li>
              )}
              {isAuthenticated && (
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('/dashboard/bookmarks')}
                    className={itemClasses(isActive('/dashboard/bookmarks'))}
                  >
                    <Bookmark className={iconClasses(isActive('/dashboard/bookmarks'))} />
                    <span>Bookmarks</span>
                  </button>
                </li>
              )}
              {isAuthenticated && (
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('/dashboard/ignored')}
                    className={itemClasses(isActive('/dashboard/ignored'))}
                  >
                    <EyeOff className={iconClasses(isActive('/dashboard/ignored'))} />
                    <span>Ignored</span>
                  </button>
                </li>
              )}
              {isAuthenticated && isApprover && (
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('/dashboard/admin')}
                    className={itemClasses(isActive('/dashboard/admin'))}
                  >
                    <ShieldAlert className="h-5 w-5 shrink-0 text-[#e31337]" />
                    <span>Admin Moderation</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/settings')}
                  className={itemClasses(isActive('/dashboard/settings'))}
                >
                  <Settings className={iconClasses(isActive('/dashboard/settings'))} />
                  <span>Settings</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/privacy')}
                  className={itemClasses(isActive('/privacy'))}
                >
                  <ShieldCheck className={iconClasses(isActive('/privacy'))} />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/about-us')}
                  className={itemClasses(isActive('/about-us'))}
                >
                  <Info className={iconClasses(isActive('/about-us'))} />
                  <span>About Us</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/')}
                  className={itemClasses(isActive('/'))}
                >
                  <Home className={iconClasses(isActive('/'))} />
                  <span>Go to welcome page</span>
                </button>
              </li>
              {!isNative && (
                <li className="border-t border-[#3a424a] pt-3">
                  <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-[#9ca3b0]">
                    Download app
                  </p>
                  <div className="flex flex-col gap-2 px-3 pb-1">
                    <a
                      href={APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-[#f0f0f8] transition hover:bg-[#2f353d]"
                      onClick={onClose}
                      aria-label="Download on the App Store"
                    >
                      <img
                        src={APP_STORE_LOGO}
                        alt=""
                        className="h-8 w-8 shrink-0 object-contain"
                      />
                      <span className="text-sm font-medium">App Store</span>
                    </a>
                    <a
                      href={PLAY_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-[#f0f0f8] transition hover:bg-[#2f353d]"
                      onClick={onClose}
                      aria-label="Get it on Google Play"
                    >
                      <img
                        src={PLAY_STORE_LOGO}
                        alt=""
                        className="h-8 w-8 shrink-0 object-contain"
                      />
                      <span className="text-sm font-medium">Play Store</span>
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </nav>

        <div className="shrink-0 border-t border-[#3a424a] px-4 py-3">
          {isMobileView && (
            <a
              href="https://vote.hive.uno/@sagarkothari88"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-[#9ca3b0] transition hover:bg-[#2f353d] hover:text-[#f0f0f8]"
              onClick={onClose}
            >
              <img
                src="https://images.hive.blog/u/sagarkothari88/avatar"
                alt=""
                className="h-6 w-6 shrink-0 rounded-full border border-[#505863] object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#e7e7f1]">Developed & Maintained</p>
                <p className="text-[10px] text-[#9ca3b0]">By Hive Witness - @sagarkothari88</p>
              </div>
            </a>
          )}
          <div className="flex items-center justify-between gap-2 text-xs text-[#9ca3b0]">
            <span title={`Branch: ${APP_BRANCH}${APP_COMMIT_HASH ? ` (${APP_COMMIT_HASH})` : ''}`}>
              {APP_BRANCH}
              {APP_COMMIT_HASH && (
                <span className="ml-1 text-[10px] opacity-90">· {APP_COMMIT_HASH}</span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <span title={`Version: ${APP_VERSION}`}>v{APP_VERSION}</span>
              {isNative ? (
                <button
                  type="button"
                  onClick={handleCopyVersion}
                  className="rounded p-1 hover:bg-[#2f353d] hover:text-[#f0f0f8]"
                  aria-label="Copy version"
                >
                  <Copy className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="rounded p-1 hover:bg-[#2f353d] hover:text-[#f0f0f8]"
                  aria-label="Refresh app"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
