/**
 * Bookmarks: list from hreplier-api, open to /snap/author/permlink.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { useAuthData } from '../stores/authStore'
import { getBookmarks, removeBookmark, type BookmarkItem } from '../services/bookmarkService'
import { toast } from 'sonner'

export function BookmarksPage() {
  const { token, isAuthenticated } = useAuthData()
  const [items, setItems] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadBookmarks = useCallback((signal?: AbortSignal) => {
    if (!token) return
    setLoading(true)
    setError(null)
    getBookmarks(token, signal)
      .then((data) => {
        if (signal?.aborted) return
        setItems(data)
      })
      .catch((e) => {
        if (signal?.aborted) return
        setError(e instanceof Error ? e.message : 'Failed to load bookmarks')
        toast.error('Failed to load bookmarks')
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false)
      })
  }, [token])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false)
      setError('Please log in to view bookmarks.')
      return
    }
    const abortController = new AbortController()
    loadBookmarks(abortController.signal)
    return () => { abortController.abort('avoid duplicate requests') }
  }, [isAuthenticated, token, loadBookmarks])

  const handleRemove = async (author: string, permlink: string) => {
    if (!token || removing) return
    const key = `${author}/${permlink}`
    setRemoving(key)
    try {
      await removeBookmark(token, author, permlink)
      setItems((prev) => prev.filter((b) => !(b.author === author && b.permlink === permlink)))
      toast.success('Bookmark removed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove bookmark')
    } finally {
      setRemoving(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Bookmark className="h-12 w-12 text-[#9ca3b0]" />
        <p className="text-[#9ca3b0]">Log in to view your bookmarks.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-[#e31337]" />
        <p className="text-sm text-[#9ca3b0]">Loading bookmarks…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-6 text-sm text-red-300">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load bookmarks</h3>
            <p className="mt-1 text-red-200/80">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Bookmark className="h-12 w-12 text-[#9ca3b0]" />
        <p className="text-[#9ca3b0]">No bookmarks yet. Add posts from the feed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold text-[#f0f0f8]">Bookmarks</h1>
      <ul className="space-y-2">
        {items.map((b) => (
          <li
            key={`${b.author}/${b.permlink}`}
            className="flex items-center gap-3 rounded-xl border border-[#3a424a] bg-[#262b30] p-4 transition hover:border-[#505863]"
          >
            <img
              src={`https://images.hive.blog/u/${b.author}/avatar`}
              alt=""
              onError={(e) => {
                e.currentTarget.src = 'https://images.hive.blog/u/null/avatar'
              }}
              className="h-10 w-10 shrink-0 rounded-full border border-[#505863] object-cover"
            />
            <Link
              to={`/@${b.author}/${b.permlink}`}
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-medium text-[#ff8fa3]">@{b.author}</p>
              <p className="mt-1 line-clamp-2 text-sm text-[#e7e7f1]">
                {b.title || b.body || `${b.author}/${b.permlink}`}
              </p>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                void handleRemove(b.author, b.permlink)
              }}
              disabled={removing === `${b.author}/${b.permlink}`}
              className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-[#2f353d] hover:text-red-400 disabled:opacity-50"
              aria-label={`Remove bookmark ${b.author}/${b.permlink}`}
            >
              {removing === `${b.author}/${b.permlink}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
