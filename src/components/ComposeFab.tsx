import { useEffect, useState } from 'react'
import type { FeedType } from '../utils/types'
import { getLatestContainer } from '../services/hiveService'
import { useAuthData } from '../stores/authStore'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'
import { FEED_LABELS, FEED_AVATARS } from '../constants/feeds'
import { FeedComposer } from './FeedComposer'
import { useBackDismiss } from '../stores/backDismissStore'

function useObserver(): string {
  const { username } = useAuthData()
  return username ?? ''
}

const FEED_TYPES: FeedType[] = ['snaps', 'waves', 'threads', 'moments']

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
  const [containerRefs, setContainerRefs] = useState<Partial<Record<FeedType, { author: string; permlink: string }>>>({})
  const [refLoading, setRefLoading] = useState(false)
  const [refError, setRefError] = useState<string | null>(null)
  const [selectedFeed, setSelectedFeed] = useState<FeedType>('snaps')

  useEffect(() => {
    if (!open) return
    const abortController = new AbortController()
    const signal = abortController.signal
    setRefLoading(true)
    setRefError(null)
    Promise.allSettled(
      FEED_TYPES.map((ft) =>
        getLatestContainer(ft, observer, signal).then((data) => ({ feedType: ft, data }))
      )
    )
      .then((results) => {
        if (signal.aborted) return
        const refs: Partial<Record<FeedType, { author: string; permlink: string }>> = {}
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value?.data) {
            refs[r.value.feedType] = r.value.data
          }
        })
        setContainerRefs(refs)
        if (Object.keys(refs).length === 0) {
          setRefError('Failed to load containers')
        }
      })
      .catch((e) => {
        if (signal.aborted) return
        setRefError(e instanceof Error ? e.message : 'Failed to load containers')
      })
      .finally(() => {
        if (!signal.aborted) setRefLoading(false)
      })
    return () => { abortController.abort('avoid duplicate requests') }
  }, [open, observer])

  // Android hardware back button: close the sheet instead of navigating away.
  useBackDismiss(open, () => setOpen(false))

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

          {/* Modal panel — max height on mobile so sheet stays visible; content scrolls */}
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#3a424a] border-b-0 bg-[#262b30] animate-[slideUp_200ms_ease-out] sm:rounded-2xl sm:border-b sm:animate-[scaleIn_200ms_ease-out]">
            {/* Header — sticky so it stays visible when content scrolls */}
            <div className="flex shrink-0 items-center justify-between px-4 py-3 bg-[#262b30] border-b border-[#3a424a] sm:border-b-0">
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

            {/* Content area — scrollable when content grows so sheet doesn't go off-screen */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#262b30]">
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

              {!refLoading && !refError && Object.keys(containerRefs).length > 0 && (
                <>
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#3a424a]">
                    <span className="text-xs font-medium text-[#9ca3b0] uppercase tracking-wide w-full shrink-0">Post to</span>
                    {FEED_TYPES.map((ft) => (
                      <label
                        key={ft}
                        className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-2 transition-colors ${
                          !containerRefs[ft] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#2f353d]/70'
                        }`}
                      >
                        <input
                          type="radio"
                          name="compose-feed"
                          value={ft}
                          checked={selectedFeed === ft}
                          onChange={() => containerRefs[ft] && setSelectedFeed(ft)}
                          disabled={!containerRefs[ft]}
                          className="h-4 w-4 shrink-0 border-[#3a424a] bg-[#2f353d] text-[#e31337] focus:ring-[#e31337]/40"
                        />
                        <img
                          src={FEED_AVATARS[ft]}
                          alt=""
                          className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-[#3a424a]"
                        />
                        <span className="text-sm font-medium text-[#f0f0f8]">{FEED_LABELS[ft]}</span>
                      </label>
                    ))}
                  </div>
                  <FeedComposer
                    feedType={feedType}
                    containerRefs={containerRefs as Partial<Record<FeedType, { author: string; permlink: string }>>}
                    selectedFeed={selectedFeed}
                    placeholder={placeholder}
                    authorMention={authorMention}
                    onSuccess={() => {
                      setOpen(false)
                      setTimeout(() => void fetchFeed(), 5000)
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
