/**
 * Pull-to-refresh wrapper for iOS/Android (Capacitor).
 * Renders a drag-down indicator and calls onRefresh when the user pulls past the threshold.
 * No-op on web — just renders children.
 */
import { useRef, useState, useCallback, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { isMobilePlatform } from '../utils/platform-detection'

const THRESHOLD = 70

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const mobile = isMobilePlatform()
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!mobile || refreshing) return
    const el = containerRef.current
    if (el && el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY
    }
  }, [mobile, refreshing])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || refreshing) return
    const dy = e.touches[0].clientY - startYRef.current
    if (dy > 0) {
      setPulling(true)
      setPullDistance(Math.min(dy * 0.5, THRESHOLD * 1.5))
    } else {
      setPulling(false)
      setPullDistance(0)
    }
  }, [refreshing])

  const onTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return
    startYRef.current = null
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullDistance(THRESHOLD * 0.6)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
    setPulling(false)
    setPullDistance(0)
  }, [pullDistance, refreshing, onRefresh])

  if (!mobile) return <>{children}</>

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const showIndicator = pulling || refreshing

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => void onTouchEnd()}
    >
      {showIndicator && (
        <div
          className="flex items-center justify-center transition-all duration-150"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            className={`h-5 w-5 text-[#9ca3b0] transition-transform ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)`, opacity: progress }}
          />
        </div>
      )}
      {children}
    </div>
  )
}
