/**
 * Bookmark toggle button: adds or removes bookmark for a post.
 * Shows filled icon when bookmarked, empty when not.
 * Uses global bookmark store so state is shared across all instances.
 */
import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useBookmarkStore } from '../stores/bookmarkStore'

interface AddBookmarkButtonProps {
  author: string
  permlink: string
  title: string
  body: string
  className?: string
  ariaLabel?: string
}

export function AddBookmarkButton({
  author,
  permlink,
  title,
  body,
  className = '',
  ariaLabel = 'Bookmark',
}: AddBookmarkButtonProps) {
  const { token, isAuthenticated } = useAuthData()
  const [submitting, setSubmitting] = useState(false)
  const bookmarked = useBookmarkStore((s) => s.isBookmarked(author, permlink))
  const loaded = useBookmarkStore((s) => s.loaded)
  const fetchBookmarks = useBookmarkStore((s) => s.fetchBookmarks)
  const addBm = useBookmarkStore((s) => s.add)
  const removeBm = useBookmarkStore((s) => s.remove)

  // Fetch bookmarks once when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !loaded) {
      void fetchBookmarks(token)
    }
  }, [isAuthenticated, token, loaded, fetchBookmarks])

  if (!isAuthenticated || !token) return null

  const handleClick = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (bookmarked) {
        await removeBm(token, author, permlink)
        toast.success('Bookmark removed')
      } else {
        await addBm(token, author, permlink, title, body)
        toast.success('Added to bookmarks')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bookmark action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={submitting}
      className={className}
      aria-label={ariaLabel}
    >
      {submitting ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#9ca3b0] border-t-transparent" />
      ) : (
        <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current text-[#e31337]' : ''}`} />
      )}
    </button>
  )
}
