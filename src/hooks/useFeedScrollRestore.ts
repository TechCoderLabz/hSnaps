import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFeedScrollStore } from '../stores/feedScrollStore'
import type { UnifiedFeedType } from './useFeedByType'

/**
 * Attach the returned ref to a scroll container (overflow-y-auto) to persist
 * and restore scroll position across remounts, keyed by feed type.
 */
export function useFeedScrollRestore(feedType: UnifiedFeedType) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const saved = useFeedScrollStore.getState().positions[feedType] ?? 0
    el.scrollTop = saved
  }, [feedType])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf: number | null = null
    const onScroll = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => {
        raf = null
        if (ref.current) {
          useFeedScrollStore.getState().save(feedType, ref.current.scrollTop)
        }
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      useFeedScrollStore.getState().save(feedType, el.scrollTop)
      el.removeEventListener('scroll', onScroll)
    }
  }, [feedType])

  return ref
}
