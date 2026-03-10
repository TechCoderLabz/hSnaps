/**
 * "Add to bookmark" button: calls bookmark API with author, permlink, title, body.
 * Shown only when authenticated. Uses token from auth store.
 */
import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { addBookmark } from '../services/bookmarkService'

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
  ariaLabel = 'Add to bookmarks',
}: AddBookmarkButtonProps) {
  const { token, isAuthenticated } = useAuthData()
  const [submitting, setSubmitting] = useState(false)

  if (!isAuthenticated || !token) return null

  const handleClick = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await addBookmark(token, { author, permlink, title, body })
      toast.success('Added to bookmarks')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add bookmark')
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
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  )
}
