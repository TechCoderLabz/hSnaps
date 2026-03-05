/**
 * Zustand store for reputation-based filtering.
 * Batch-checks reputation for visible post authors and caches results.
 * Cache is never cleared — persists for the lifetime of the app.
 * Once a user is confirmed as low-rep (< 10), that result is locked
 * permanently and never re-checked during background refresh.
 */
import { create } from 'zustand'

const REPUTATION_API = 'https://api.syncad.com/reputation-api/accounts'
const REFRESH_INTERVAL = 60 * 60 * 1000 // 1 hour
const BATCH_DELAY = 200 // ms between sequential API calls
const LOW_REP_THRESHOLD = 10

interface ReputationState {
  /** Map of username → reputation score (-1 means unknown/error) */
  cache: Record<string, number>
  /** Usernames queued for checking */
  pending: Set<string>
  /** Whether a batch check is currently running */
  checking: boolean

  /** Register a username to be checked (called by PostCard) */
  registerAuthor: (username: string) => void
  /** Flush pending usernames — check them now */
  flushPending: () => Promise<void>
}

async function fetchReputation(username: string): Promise<number> {
  const res = await fetch(`${REPUTATION_API}/${username}/reputation`)
  if (!res.ok) return -1
  const text = await res.text()
  const num = Number(text)
  return Number.isFinite(num) ? num : -1
}

/** Check if a username has low reputation from the cache */
export function checkLowReputation(cache: Record<string, number>, username: string): boolean {
  const score = cache[username]
  if (score === undefined) return false // Not yet checked — show post by default
  return score < LOW_REP_THRESHOLD
}

export const useReputationStore = create<ReputationState>((set, get) => ({
  cache: {},
  pending: new Set(),
  checking: false,

  registerAuthor: (username) => {
    const state = get()
    if (state.cache[username] !== undefined) return
    if (state.pending.has(username)) return
    set((s) => {
      const next = new Set(s.pending)
      next.add(username)
      return { pending: next }
    })
    // Auto-flush after a small debounce to batch registrations
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
        set((s) => ({
          cache: { ...s.cache, [username]: score },
        }))
      } catch {
        set((s) => ({
          cache: { ...s.cache, [username]: s.cache[username] ?? -1 },
        }))
      }
      if (usernames.indexOf(username) < usernames.length - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY))
      }
    }

    set({ checking: false })
  },
}))

// Background refresh — runs once at module load, never stops.
// Only re-checks users with rep >= 10. Low-rep users are locked permanently.
setInterval(() => {
  const refresh = async () => {
    const s = useReputationStore.getState()
    // Skip users already confirmed as low-rep — their score is final
    const usernames = Object.entries(s.cache)
      .filter(([, score]) => score >= LOW_REP_THRESHOLD)
      .map(([name]) => name)
    if (usernames.length === 0) return

    for (const username of usernames) {
      try {
        const score = await fetchReputation(username)
        useReputationStore.setState((prev) => ({
          cache: { ...prev.cache, [username]: score },
        }))
      } catch {
        // Keep existing cache on failure
      }
      await new Promise((r) => setTimeout(r, BATCH_DELAY))
    }
  }
  void refresh()
}, REFRESH_INTERVAL)
