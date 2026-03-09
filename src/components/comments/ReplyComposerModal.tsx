/**
 * Same pop-up as "Create new post" but for replying: shows FeedComposer
 * with parent author name & profile image. Used for "Add comment" and "Reply".
 */
import { useEffect, useState } from 'react'
import { FeedComposer } from '../FeedComposer'
import type { FeedType } from '../../utils/types'

interface ReplyComposerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  parentAuthor: string
  parentPermlink: string
  /** Optional avatar URL; defaults to Hive images. */
  parentAvatarUrl?: string
  placeholder?: string
  /** Feed type for composer (reply mode uses comment metadata regardless). */
  feedType?: FeedType
}

const DEFAULT_FEED_TYPE: FeedType = 'threads'

export function ReplyComposerModal({
  isOpen,
  onClose,
  onSuccess,
  parentAuthor,
  parentPermlink,
  parentAvatarUrl,
  placeholder = 'Write your comment...',
  feedType = DEFAULT_FEED_TYPE,
}: ReplyComposerModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(isOpen)
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  const avatarUrl = parentAvatarUrl ?? `https://images.hive.blog/u/${parentAuthor}/avatar`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-2xl animate-[slideUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out] rounded-2xl border border-[#3a424a] bg-[#262b30] overflow-hidden">
        {/* Header: same style as Create new post, with parent author + avatar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#262b30]">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={parentAuthor}
              className="h-10 w-10 rounded-full border border-[#3a424a] object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(parentAuthor)}&background=random`
              }}
            />
            <div>
              <h2 className="text-base font-semibold text-[#f0f0f8]">Reply to @{parentAuthor}</h2>
              <p className="text-xs text-[#9ca3b0]">Comment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3b0] transition-colors duration-200 hover:bg-[#2f353d] hover:text-[#f0f0f8] focus:outline-none focus:ring-2 focus:ring-[#e31337]/40"
            aria-label="Close"
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

        <div className="bg-[#262b30] p-4">
          <FeedComposer
            feedType={feedType}
            parentAuthor={parentAuthor}
            parentPermlink={parentPermlink}
            placeholder={placeholder}
            replyMode
            onSuccess={() => {
              onClose()
              onSuccess()
            }}
          />
        </div>
      </div>
    </div>
  )
}
