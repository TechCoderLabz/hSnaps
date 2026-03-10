/**
 * Common app header: optional left slot (e.g. menu), logo + "hSnaps", optional right slot (default: HiveLoginButton).
 * Logo and title both navigate to landing (/) or dashboard when authenticated.
 */
import { Link } from 'react-router-dom'
import { AppLogo } from './AppLogo'
import { HiveLoginButton } from './HiveLoginButton'
import { useAuthData } from '../stores/authStore'

interface AppHeaderProps {
  /** Left-side content (e.g. drawer menu button). */
  left?: React.ReactNode
  /** Center content (e.g. nav links on landing). */
  center?: React.ReactNode
  /** Right-side content (e.g. login button or feed switcher). Defaults to HiveLoginButton. Pass null to show nothing. */
  right?: React.ReactNode | null
  /** Optional class for the header element (e.g. sticky, border, background). */
  className?: string
  /** When true, hide logo and "hSnaps" title on mobile (md and up they show). */
  hideBrandOnMobile?: boolean
}

export function AppHeader({ left, center, right, className, hideBrandOnMobile }: AppHeaderProps) {
  const { isAuthenticated } = useAuthData()
  const to = isAuthenticated ? '/dashboard' : '/'
  const brandClass = hideBrandOnMobile ? 'hidden md:flex min-w-0 flex-1 items-center gap-2' : 'flex min-w-0 flex-1 items-center gap-2'

  return (
    <header
      className={
        [
          'flex items-center justify-between gap-2 px-4 py-5 sm:px-8',
          className,
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      <div className={brandClass}>
        {left}
        <AppLogo />
        <Link
          to={to}
          className="text-xl font-semibold bg-gradient-to-r from-[#f0f0f8] via-[#e7e7f1] to-[#ff7a92] bg-clip-text text-transparent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded sm:text-2xl"
          aria-label={isAuthenticated ? 'Go to dashboard' : 'Go to home'}
        >
          hSnaps
        </Link>
      </div>
      {center ? <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-3 md:gap-6" aria-label="Page sections">{center}</nav> : null}
      <div className="flex shrink-0 items-center gap-3">
        {right === undefined ? <HiveLoginButton /> : right}
      </div>
    </header>
  )
}
