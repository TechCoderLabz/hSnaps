/**
 * Blacklist store: caches a merged set of blacklisted Hive accounts from
 *  - ecency bad-actors list
 *  - spaminator.me blacklist
 *  - a small hardcoded list
 *
 * Refreshed at most once per day, persisted in localStorage.
 */
import { create } from 'zustand'

const STORAGE_KEY = 'blacklist'
const REFRESH_MS = 24 * 60 * 60 * 1000

const ECENCY_URL = 'https://raw.githubusercontent.com/ecency/hivescript/master/bad-actors.json'
const SPAMINATOR_URL = 'https://spaminator.me/api/bl/all.txt'

const OUR_BLACKLIST = [
  'steem',
  'pink.wizz',
  'cryptomother',
  'cryptokamar',
  'cryptosana',
  'hive.aid',
  'ocd',
  'ocdb',
  'appreciator',
]

interface StoredBlacklist {
  fetchedAt: number
  list: string[]
}

function loadFromStorage(): StoredBlacklist | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredBlacklist
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !Array.isArray(parsed.list)) return null
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(data: StoredBlacklist): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

async function fetchEcency(): Promise<string[]> {
  try {
    const res = await fetch(ECENCY_URL)
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    return Array.isArray(data) ? (data as string[]).filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

async function fetchSpaminator(): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(SPAMINATOR_URL, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return []
    const text = await res.text()
    const lines = text.split('\n')
    lines.shift() // remove year line e.g. "2024"
    lines.shift() // remove "---"
    return lines.map((l) => l.trim()).filter(Boolean)
  } catch {
    return []
  }
}

interface BlacklistState {
  set: Set<string>
  fetchedAt: number
  loaded: boolean
  inflight: Promise<void> | null
  /** Refresh from network if cache is older than 24h. Idempotent / dedup'd. */
  ensureFresh: () => Promise<void>
  isBlacklisted: (username: string) => boolean
}

const stored = loadFromStorage()
const initialList = stored?.list ?? OUR_BLACKLIST
const initialSet = new Set(initialList.map((s) => s.toLowerCase()))

export const useBlacklistStore = create<BlacklistState>((setState, get) => ({
  set: initialSet,
  fetchedAt: stored?.fetchedAt ?? 0,
  loaded: !!stored,
  inflight: null,

  ensureFresh: () => {
    const state = get()
    if (state.inflight) return state.inflight
    if (Date.now() - state.fetchedAt < REFRESH_MS) return Promise.resolve()

    const promise = (async () => {
      const [ecency, spam] = await Promise.all([fetchEcency(), fetchSpaminator()])
      const merged = new Set<string>()
      for (const u of [...ecency, ...spam, ...OUR_BLACKLIST]) {
        if (typeof u === 'string' && u) merged.add(u.toLowerCase())
      }
      const list = Array.from(merged)
      const fetchedAt = Date.now()
      saveToStorage({ fetchedAt, list })
      setState({ set: merged, fetchedAt, loaded: true, inflight: null })
    })().catch(() => {
      setState({ inflight: null })
    })

    setState({ inflight: promise })
    return promise
  },

  isBlacklisted: (username: string) => {
    if (!username) return false
    return get().set.has(username.toLowerCase())
  },
}))

/** Pure helper for feed filters that already subscribe to the store's `set`. */
export function isBlacklisted(set: Set<string>, username: string): boolean {
  if (!username) return false
  return set.has(username.toLowerCase())
}
