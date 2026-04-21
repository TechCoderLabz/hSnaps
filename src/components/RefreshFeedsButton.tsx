/**
 * Header button that refetches all four feeds (snaps, threads, waves, moments) in parallel.
 */
import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { useSnapsStore } from '../stores/snapsStore'
import { useThreadsStore } from '../stores/threadsStore'
import { useWavesStore } from '../stores/wavesStore'
import { useMomentStore } from '../stores/momentStore'

export function RefreshFeedsButton() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    const stores = [useSnapsStore, useThreadsStore, useWavesStore, useMomentStore]
    stores.forEach((s) => s.getState().reset())
    try {
      await Promise.all(stores.map((s) => s.getState().fetchFeed()))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleRefresh()}
      disabled={refreshing}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3a424a] bg-[#262b30] text-[#f0f0f8] hover:bg-[#2f353d] focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
      aria-label="Refresh feeds"
      title="Refresh feeds"
    >
      <RotateCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
    </button>
  )
}
