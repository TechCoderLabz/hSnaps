/**
 * Common app header: logo + "Snaps" label (left), optional right slot (default: HiveLoginButton).
 * Use on Landing, Dashboard, and any other layout.
 */
import { AppLogo } from './AppLogo'
import { HiveLoginButton } from './HiveLoginButton'

interface AppHeaderProps {
  /** Right-side content (e.g. login button or user menu). Defaults to HiveLoginButton. */
  right?: React.ReactNode
  /** Optional class for the header element (e.g. sticky, border, background). */
  className?: string
}

export function AppHeader({ right, className }: AppHeaderProps) {
  return (
    <header
      className={
        [
          'flex items-center justify-between px-4 py-5 sm:px-8',
          className,
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      <div className="flex items-center gap-2">
        <AppLogo />
        <span className="text-2xl font-semibold bg-gradient-to-r from-[#f0f0f8] via-[#e7e7f1] to-[#ff7a92] bg-clip-text text-transparent">
          Snaps
        </span>
      </div>
      <div className="flex items-center gap-3">
        {right ?? <HiveLoginButton />}
      </div>
    </header>
  )
}
