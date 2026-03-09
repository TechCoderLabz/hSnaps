import { useEffect, useState } from 'react'
import type { FeedType } from '../utils/types'
import { getLatestContainer } from '../services/hiveService'
import { useAuthData } from '../stores/authStore'

function useObserver(): string {
  const { username } = useAuthData()
  return username ?? ''
}
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { FeedComposer } from './FeedComposer'

const FEED_STORES: Record<FeedType, () => { fetchFeed: () => Promise<void> }> = {
  snaps: useSnapsStore,
  threads: useThreadsStore,
  waves: useWavesStore,
  moments: useMomentStore,
}

interface ComposeFabProps {
  feedType: FeedType
  placeholder?: string
  authorMention?: string
}

/** Floating action button that opens FeedComposer in a popup dialog. Visible only when logged in. */
export function ComposeFab({
  feedType,
  placeholder,
  authorMention,
}: ComposeFabProps) {
  const { isAuthenticated } = useAuthData()
  const observer = useObserver()
  const { fetchFeed } = FEED_STORES[feedType]()
  const [open, setOpen] = useState(false)
  const [containerRef, setContainerRef] = useState<{ author: string; permlink: string } | null>(null)
  const [refLoading, setRefLoading] = useState(false)
  const [refError, setRefError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const abortController = new AbortController()
    const signal = abortController.signal
    setRefLoading(true)
    setRefError(null)
    getLatestContainer(feedType, observer, signal)
      .then((data) => {
        if (signal.aborted) return
        setContainerRef(data)
      })
      .catch((e) => {
        if (signal.aborted) return
        setRefError(e instanceof Error ? e.message : 'Failed to load container')
      })
      .finally(() => {
        if (!signal.aborted) setRefLoading(false)
      })
    return () => { abortController.abort('avoid duplicate requests') }
  }, [open, feedType, observer])

  if (!isAuthenticated) return null

  return (
    <>
      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#e31337] text-white shadow-xl shadow-black/40 transition-all duration-200 hover:scale-110 hover:bg-[#c51231] hover:shadow-2xl hover:shadow-black/50 focus:outline-none focus:ring-2 focus:ring-[#e31337]/70 focus:ring-offset-2 focus:ring-offset-[#212529] active:scale-95 md:bottom-6 md:right-8"
        aria-label="Create new post"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="h-6 w-6"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Modal panel — single panel, no line below header */}
          <div className="relative z-10 w-full max-w-2xl animate-[slideUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out] rounded-2xl border border-[#3a424a] bg-[#262b30] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#262b30]">
              <h2 className="text-base font-semibold text-[#f0f0f8]">Create new post</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3b0] transition-colors duration-200 hover:bg-[#2f353d] hover:text-[#f0f0f8] focus:outline-none focus:ring-2 focus:ring-[#e31337]/40"
                aria-label="Close composer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content area */}
            <div className="bg-[#262b30]">
              {refLoading && (
                <div className="flex items-center justify-center gap-3 px-4 py-10 text-sm text-[#9ca3b0]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e31337] border-t-transparent" />
                  <span>Loading…</span>
                </div>
              )}

              {refError && (
                <div className="m-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <div>
                    <p className="font-medium">Something went wrong</p>
                    <p className="mt-0.5 text-red-400/80">{refError}</p>
                  </div>
                </div>
              )}

              {!refLoading && !refError && containerRef && (
                <FeedComposer
                  feedType={feedType}
                  parentAuthor={containerRef.author}
                  parentPermlink={containerRef.permlink}
                  placeholder={placeholder}
                  authorMention={authorMention}
                  onSuccess={() => {
                    setOpen(false)
                    setTimeout(() => void fetchFeed(), 5000)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
