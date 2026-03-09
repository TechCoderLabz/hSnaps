/**
 * Store for ignored authors list (from hreplier-api).
 * Used by Ignored page and by feed filtering.
 */
import { create } from 'zustand'
import {
  getIgnoredAuthors,
  addIgnoredAuthor as addApi,
  removeIgnoredAuthor as removeApi,
} from '../services/ignoredAuthorsService'

interface IgnoredAuthorsState {
  list: string[]
  loading: boolean
  error: string | null
  setList: (list: string[]) => void
  fetchList: (token: string) => Promise<void>
  addAuthor: (token: string, username: string) => Promise<void>
  removeAuthor: (token: string, username: string) => Promise<void>
  isIgnored: (username: string) => boolean
}

export const useIgnoredAuthorsStore = create<IgnoredAuthorsState>((set, get) => ({
  list: [],
  loading: false,
  error: null,

  setList: (list: string[]) => set({ list }),

  fetchList: async (token: string) => {
    set({ loading: true, error: null })
    try {
      const list = await getIgnoredAuthors(token)
      set({ list, loading: false })
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load ignored authors',
        loading: false,
      })
      throw e
    }
  },

  addAuthor: async (token: string, username: string) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) return
    set({ error: null })
    try {
      const list = await addApi(token, trimmed)
      set({ list })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to add' })
      throw e
    }
  },

  removeAuthor: async (token: string, username: string) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) return
    set({ error: null })
    try {
      const list = await removeApi(token, trimmed)
      set({ list })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to remove' })
      throw e
    }
  },

  isIgnored: (username: string) => {
    const list = get().list
    if (!list.length) return false
    const u = username.toLowerCase()
    return list.some((a) => a.toLowerCase() === u)
  },
}))

/** Helper for feed filtering: exclude posts whose author is ignored. */
export function isAuthorIgnored(username: string): boolean {
  return useIgnoredAuthorsStore.getState().isIgnored(username)
}
