/**
 * Zustand store for reputation-based filtering.
 * Caches reputation in localStorage (key: "reputation"). Only users with
 * reputation >= 10 are shown in the feed. We never call the API again
 * for a user already in cache — only when cache is cleared.
 */
import { create } from 'zustand'

const REPUTATION_API = 'https://api.syncad.com/reputation-api/accounts'
const STORAGE_KEY = 'reputation'
const BATCH_DELAY = 200 // ms between sequential API calls
const LOW_REP_THRESHOLD = 10

export interface StoredReputationItem {
  name: string
  reputation: number
}

function loadReputationFromStorage(): Record<string, number> {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const arr = JSON.parse(raw) as StoredReputationItem[]
    if (!Array.isArray(arr)) return {}
    const out: Record<string, number> = {}
    for (const item of arr) {
      if (item && typeof item.name === 'string' && typeof item.reputation === 'number') {
        out[item.name] = item.reputation
      }
    }
    return out
  } catch {
    return {}
  }
}

function saveReputationToStorage(cache: Record<string, number>): void {
  try {
    if (typeof localStorage === 'undefined') return
    const arr: StoredReputationItem[] = Object.entries(cache).map(([name, reputation]) => ({
      name,
      reputation,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {
    // ignore
  }
}

interface ReputationState {
  /** Map of username → reputation score (-1 means unknown/error). Loaded from localStorage. */
  cache: Record<string, number>
  /** Usernames queued for checking (not yet in cache) */
  pending: Set<string>
  /** Whether a batch check is currently running */
  checking: boolean

  /** Register a username to be checked (called by PostCard). Skips if already in cache. */
  registerAuthor: (username: string) => void
  /** Flush pending usernames — fetch from API only for users not in cache, then persist. */
  flushPending: () => Promise<void>
}

async function fetchReputation(username: string): Promise<number> {
  const res = await fetch(`${REPUTATION_API}/${username}/reputation`)
  if (!res.ok) return -1
  const text = await res.text()
  const num = Number(text)
  return Number.isFinite(num) ? num : -1
}

/** Check if a username has low reputation from the cache. Below threshold = hide from feed. */
export function checkLowReputation(cache: Record<string, number>, username: string): boolean {
  const score = cache[username]
  if (score === undefined) return false // Not yet in cache — show post by default until we fetch
  return score < LOW_REP_THRESHOLD
}

export const useReputationStore = create<ReputationState>((set, get) => ({
  cache: loadReputationFromStorage(),
  pending: new Set(),
  checking: false,

  registerAuthor: (username) => {
    const state = get()
    if (state.cache[username] !== undefined) return // Already cached — never re-fetch
    if (state.pending.has(username)) return
    set((s) => {
      const next = new Set(s.pending)
      next.add(username)
      return { pending: next }
    })
    setTimeout(() => {
      const s = get()
      if (s.pending.size > 0 && !s.checking) {
        void s.flushPending()
      }
    }, 300)
  },

  flushPending: async () => {
    const state = get()
    if (state.checking || state.pending.size === 0) return
    set({ checking: true })

    const usernames = Array.from(state.pending)
    set({ pending: new Set() })

    for (const username of usernames) {
      try {
        const score = await fetchReputation(username)
        set((s) => {
          const next = { ...s.cache, [username]: score }
          saveReputationToStorage(next)
          return { cache: next }
        })
      } catch {
        set((s) => {
          const score = s.cache[username] ?? -1
          const next = { ...s.cache, [username]: score }
          saveReputationToStorage(next)
          return { cache: next }
        })
      }
      if (usernames.indexOf(username) < usernames.length - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY))
      }
    }

    set({ checking: false })
  },
}))
