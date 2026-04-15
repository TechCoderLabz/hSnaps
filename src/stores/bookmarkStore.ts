/**
 * Zustand store for bookmark status.
 * Fetches the user's bookmarks once on login and caches the set of
 * "author/permlink" keys so AddBookmarkButton can show filled/empty state.
 */
import { create } from 'zustand'
import { getBookmarks, addBookmark, removeBookmark } from '../services/bookmarkService'

interface BookmarkState {
  /** Set of "author/permlink" keys the current user has bookmarked */
  bookmarkedKeys: Set<string>
  /** Whether the initial fetch has completed */
  loaded: boolean
  /** In-flight fetch promise (dedupes concurrent callers) */
  inflight: Promise<void> | null
  /** Fetch all bookmarks for the current user */
  fetchBookmarks: (token: string) => Promise<void>
  /** Add a bookmark and update local state */
  add: (token: string, author: string, permlink: string, title: string, body: string) => Promise<void>
  /** Remove a bookmark and update local state */
  remove: (token: string, author: string, permlink: string) => Promise<void>
  /** Check if a post is bookmarked */
  isBookmarked: (author: string, permlink: string) => boolean
  /** Clear store on logout */
  clear: () => void
}

const makeKey = (author: string, permlink: string) => `${author}/${permlink}`

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarkedKeys: new Set(),
  loaded: false,
  inflight: null,

  fetchBookmarks: (token: string) => {
    const existing = get().inflight
    if (existing) return existing
    if (get().loaded) return Promise.resolve()
    const promise = (async () => {
      try {
        const items = await getBookmarks(token)
        const keys = new Set(items.map((i) => makeKey(i.author, i.permlink)))
        set({ bookmarkedKeys: keys, loaded: true })
      } catch {
        set({ loaded: true })
      } finally {
        set({ inflight: null })
      }
    })()
    set({ inflight: promise })
    return promise
  },

  add: async (token, author, permlink, title, body) => {
    await addBookmark(token, { author, permlink, title, body })
    set((state) => {
      const next = new Set(state.bookmarkedKeys)
      next.add(makeKey(author, permlink))
      return { bookmarkedKeys: next }
    })
  },

  remove: async (token, author, permlink) => {
    await removeBookmark(token, author, permlink)
    set((state) => {
      const next = new Set(state.bookmarkedKeys)
      next.delete(makeKey(author, permlink))
      return { bookmarkedKeys: next }
    })
  },

  isBookmarked: (author, permlink) => {
    return get().bookmarkedKeys.has(makeKey(author, permlink))
  },

  clear: () => set({ bookmarkedKeys: new Set(), loaded: false, inflight: null }),
}))
