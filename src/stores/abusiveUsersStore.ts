/**
 * Abusive users store: caches the admin-curated blacklist from
 * `${API_SERVER}/admin/abusive-users`. This endpoint is public (no auth),
 * so every visitor — logged in or not — gets the same filtered feed.
 *
 * Refreshed at most once per day, persisted in localStorage.
 */
import { create } from 'zustand'
import { getAbusiveUsers } from '../services/adminService'

const STORAGE_KEY = 'abusiveUsers'
const REFRESH_MS = 24 * 60 * 60 * 1000

interface StoredAbusive {
  fetchedAt: number
  list: string[]
}

function loadFromStorage(): StoredAbusive | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAbusive
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !Array.isArray(parsed.list)) return null
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(data: StoredAbusive): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

interface AbusiveUsersState {
  set: Set<string>
  fetchedAt: number
  loaded: boolean
  inflight: Promise<void> | null
  /** Refresh from network if cache is older than 24h. Idempotent / dedup'd. */
  ensureFresh: () => Promise<void>
  /** Force-refresh from network, bypassing the 24h TTL. Still dedup'd via inflight. */
  refresh: () => Promise<void>
  isAbusive: (username: string) => boolean
}

async function doFetch(setState: (s: Partial<AbusiveUsersState>) => void): Promise<void> {
  try {
    const users = await getAbusiveUsers()
    const merged = new Set<string>()
    for (const u of users) {
      if (u && typeof u.name === 'string' && u.name) merged.add(u.name.toLowerCase())
    }
    const list = Array.from(merged)
    const fetchedAt = Date.now()
    saveToStorage({ fetchedAt, list })
    setState({ set: merged, fetchedAt, loaded: true, inflight: null })
  } catch {
    setState({ inflight: null })
  }
}

const stored = loadFromStorage()
const initialSet = new Set((stored?.list ?? []).map((s) => s.toLowerCase()))

export const useAbusiveUsersStore = create<AbusiveUsersState>((setState, get) => ({
  set: initialSet,
  fetchedAt: stored?.fetchedAt ?? 0,
  loaded: !!stored,
  inflight: null,

  ensureFresh: () => {
    const state = get()
    if (state.inflight) return state.inflight
    if (Date.now() - state.fetchedAt < REFRESH_MS) return Promise.resolve()

    const promise = doFetch(setState)
    setState({ inflight: promise })
    return promise
  },

  refresh: () => {
    const state = get()
    if (state.inflight) return state.inflight
    const promise = doFetch(setState)
    setState({ inflight: promise })
    return promise
  },

  isAbusive: (username: string) => {
    if (!username) return false
    return get().set.has(username.toLowerCase())
  },
}))

/** Pure helper for feed filters that already subscribe to the store's `set`. */
export function isAbusive(set: Set<string>, username: string): boolean {
  if (!username) return false
  return set.has(username.toLowerCase())
}
