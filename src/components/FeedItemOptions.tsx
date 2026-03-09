/**
 * Options menu for a feed item: Flag (opens ReportModal from hive-authentication).
 * On report: add author to ignored, refetch feeds, optional callback (e.g. navigate away on detail page).
 */
import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Flag } from 'lucide-react'
import { ReportModal } from 'hive-authentication'
import { useAuthData } from '../stores/authStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { toast } from 'sonner'

interface FeedItemOptionsProps {
  targetUsername: string
  targetPermlink: string
  /** Called after report with the reported username (e.g. to navigate away if reporting root author on detail page). */
  onReportedAuthor?: (username: string) => void
  className?: string
  ariaLabel?: string
}

export function FeedItemOptions({
  targetUsername,
  targetPermlink,
  onReportedAuthor,
  className = '',
  ariaLabel = 'Options',
}: FeedItemOptionsProps) {
  const { token, isAuthenticated } = useAuthData()
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const addAuthor = useIgnoredAuthorsStore((s) => s.addAuthor)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  const handleReport = async () => {
    if (!token?.trim()) {
      toast.error('Please log in to report')
      setReportModalOpen(false)
      return
    }
    try {
      await addAuthor(token, targetUsername)
      toast.success(`@${targetUsername} added to ignored list`)
      setReportModalOpen(false)
      useSnapsStore.getState().fetchFeed().catch(() => {})
      useThreadsStore.getState().fetchFeed().catch(() => {})
      useWavesStore.getState().fetchFeed().catch(() => {})
      useMomentStore.getState().fetchFeed().catch(() => {})
      onReportedAuthor?.(targetUsername)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add to ignored')
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className={`relative shrink-0 ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="rounded-lg p-2 text-[#9ca3b0] transition-colors hover:bg-[#2f353d] hover:text-[#f0f0f8]"
        aria-label={ariaLabel}
        aria-expanded={menuOpen}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[140px] rounded-xl border border-[#3a424a] bg-[#262b30] py-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              setReportModalOpen(true)
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#f0f0f8] transition-colors hover:bg-[#2f353d]"
          >
            <Flag className="h-4 w-4 text-[#9ca3b0]" />
            Flag
          </button>
        </div>
      )}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onReport={handleReport}
        reportType="post"
        targetUsername={targetUsername}
        targetPermlink={targetPermlink}
      />
    </div>
  )
}
