import { useState } from 'react'
import type { FeedType } from '../utils/types'
import { FeedComposer } from './FeedComposer'

interface ComposeFabProps {
  feedType: FeedType
  placeholder?: string
  authorMention?: string
}

/** Floating action button that opens FeedComposer in a popup dialog. */
export function ComposeFab({
  feedType,
  placeholder,
  authorMention,
}: ComposeFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#e31337] text-white shadow-lg shadow-black/50 hover:bg-[#c51231] focus:outline-none focus:ring-2 focus:ring-[#e31337]/70 md:bottom-6 md:right-8"
        aria-label="Create new post"
      >
        <span className="text-2xl leading-none">＋</span>
      </button>

      {/* Popup with FeedComposer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-[#f0f0f8]">Create new post</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-[#c8cad6] hover:bg-[#2f353d]"
                aria-label="Close composer"
              >
                ×
              </button>
            </div>
            <FeedComposer
              feedType={feedType}
              placeholder={placeholder}
              authorMention={authorMention}
            />
          </div>
        </div>
      )}
    </>
  )
}

