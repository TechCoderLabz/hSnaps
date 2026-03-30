import { create } from 'zustand'

export type HiveApiNode =
  | 'https://api.hive.blog'
  | 'https://api.syncad.com'
  | 'https://api.deathwing.me'
  | 'https://hive-api.arcange.eu'
  | 'https://api.openhive.network'
  | 'https://rpc.mahdiyari.info'
  | 'https://hive-api.3speak.tv'
  | 'https://anyx.io'
  | 'https://techcoderx.com'
  | 'https://api.c0ff33a.uk'
  | 'https://hive.roelandp.nl'

export const HIVE_API_NODE_OPTIONS: { value: HiveApiNode; label: string }[] = [
  { value: 'https://api.hive.blog', label: 'api.hive.blog' },
  { value: 'https://api.syncad.com', label: 'api.syncad.com' },
  { value: 'https://api.deathwing.me', label: 'api.deathwing.me' },
  { value: 'https://hive-api.arcange.eu', label: 'hive-api.arcange.eu' },
  { value: 'https://api.openhive.network', label: 'api.openhive.network' },
  { value: 'https://rpc.mahdiyari.info', label: 'rpc.mahdiyari.info' },
  { value: 'https://hive-api.3speak.tv', label: 'hive-api.3speak.tv' },
  { value: 'https://anyx.io', label: 'anyx.io' },
  { value: 'https://techcoderx.com', label: 'techcoderx.com' },
  { value: 'https://api.c0ff33a.uk', label: 'api.c0ff33a.uk' },
  { value: 'https://hive.roelandp.nl', label: 'hive.roelandp.nl' },
]

const STORAGE_KEY = 'hsnaps-hive-api-node'
const DEFAULT_NODE: HiveApiNode = 'https://api.hive.blog'

function loadNode(): HiveApiNode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && HIVE_API_NODE_OPTIONS.some((o) => o.value === saved)) {
      return saved as HiveApiNode
    }
  } catch { /* ignore */ }
  return DEFAULT_NODE
}

interface HiveNodeState {
  hiveApiNode: HiveApiNode
  setHiveApiNode: (node: HiveApiNode) => void
}

export const useHiveNodeStore = create<HiveNodeState>((set) => ({
  hiveApiNode: loadNode(),
  setHiveApiNode: (node) => {
    try { localStorage.setItem(STORAGE_KEY, node) } catch { /* ignore */ }
    set({ hiveApiNode: node })
  },
}))

/**
 * Read the selected Hive API node from localStorage.
 * Safe to call from non-React service files.
 */
export function getHiveApiNode(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && HIVE_API_NODE_OPTIONS.some((o) => o.value === saved)) {
      return saved
    }
  } catch { /* ignore */ }
  return DEFAULT_NODE
}
