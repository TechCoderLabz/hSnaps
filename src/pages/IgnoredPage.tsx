/**
 * Ignored authors: list from API, add by username, remove per row.
 */
import { useEffect, useState } from 'react'
import { EyeOff, Loader2, AlertCircle, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useIgnoredAuthorsStore } from '../stores/ignoredAuthorsStore'

export function IgnoredPage() {
  const { token, isAuthenticated } = useAuthData()
  const { list, loading, error, fetchList, addAuthor, removeAuthor } = useIgnoredAuthorsStore()
  const [username, setUsername] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !token) return
    const abortController = new AbortController()
    fetchList(token, abortController.signal).catch(() => {
      if (!abortController.signal.aborted) toast.error('Failed to load ignored authors')
    })
    return () => { abortController.abort('avoid duplicate requests') }
  }, [isAuthenticated, token, fetchList])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !username.trim() || adding) return
    setAdding(true)
    try {
      await addAuthor(token, username.trim())
      setUsername('')
      toast.success('Author added to ignored list')
    } catch {
      toast.error('Failed to add author')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (author: string) => {
    if (!token || removing) return
    setRemoving(author)
    try {
      await removeAuthor(token, author)
      toast.success('Author removed from ignored list')
    } catch {
      toast.error('Failed to remove author')
    } finally {
      setRemoving(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <EyeOff className="h-12 w-12 text-[#9ca3b0]" />
        <p className="text-[#9ca3b0]">Log in to manage ignored authors.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-[#f0f0f8]">Ignored authors</h1>
      <p className="text-sm text-[#9ca3b0]">
        Posts from these authors are hidden from your feed.
      </p>

      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username to ignore"
          className="rounded-lg border border-[#3a424a] bg-[#2f353d] px-3 py-2 text-sm text-[#f0f0f8] placeholder-[#9ca3b0] focus:border-[#e31337] focus:outline-none min-w-[180px]"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={adding || !username.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white hover:bg-[#c51231] disabled:opacity-50"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Add
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="flex items-center gap-2 py-8 text-[#9ca3b0]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading…</span>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-[#3a424a] bg-[#262b30] px-4 py-8 text-center text-sm text-[#9ca3b0]">
          No ignored authors. Add a username above to hide their posts from your feed.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((author) => (
            <li
              key={author}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#3a424a] bg-[#262b30] px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <img
                  src={`https://images.hive.blog/u/${author}/avatar`}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.hive.blog/u/null/avatar'
                  }}
                  className="h-9 w-9 shrink-0 rounded-full border border-[#505863] object-cover"
                />
                <span className="truncate font-medium text-[#ff8fa3]">@{author}</span>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove(author)}
                disabled={removing === author}
                className="rounded-lg p-2 text-zinc-400 hover:bg-[#2f353d] hover:text-red-400 disabled:opacity-50"
                aria-label={`Remove ${author} from ignored list`}
              >
                {removing === author ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
