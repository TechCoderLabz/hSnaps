/**
 * Fullscreen image preview with left/right swipe and close button.
 * Uses original image URLs (no proxy). Border and rounded corners; arrows only when >1 image.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { proxyImageUrl } from '../utils/imageProxy'

const SWIPE_THRESHOLD_PX = 50

export interface ImageLightboxProps {
  imageUrls: string[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ imageUrls, initialIndex, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [imageLoading, setImageLoading] = useState(true)
  const touchStartX = useRef<number | null>(null)
  const touchSwipeHandled = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const dragSwipeHandled = useRef(false)

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? imageUrls.length - 1 : i - 1))
  }, [imageUrls.length])
  const goNext = useCallback(() => {
    setIndex((i) => (i >= imageUrls.length - 1 ? 0 : i + 1))
  }, [imageUrls.length])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, goPrev, goNext])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
    touchSwipeHandled.current = false
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null || touchSwipeHandled.current) return
      const x = e.targetTouches[0]?.clientX ?? touchStartX.current
      const dx = touchStartX.current - x
      if (Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
        touchSwipeHandled.current = true
        if (dx > 0) goNext()
        else goPrev()
        touchStartX.current = null
      }
    },
    [goPrev, goNext]
  )

  const onTouchEnd = useCallback(() => {
    touchStartX.current = null
    touchSwipeHandled.current = false
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragStartX.current = e.clientX
    dragSwipeHandled.current = false
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartX.current == null || e.buttons !== 1 || dragSwipeHandled.current) return
      const dx = dragStartX.current - e.clientX
      if (Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
        dragSwipeHandled.current = true
        if (dx > 0) goNext()
        else goPrev()
        dragStartX.current = null
      }
    },
    [goPrev, goNext]
  )

  const onPointerUp = useCallback(() => {
    dragStartX.current = null
    dragSwipeHandled.current = false
  }, [])

  const proxiedUrls = useMemo(() => imageUrls.map((u) => proxyImageUrl(u)), [imageUrls])

  if (proxiedUrls.length === 0) return null

  const current = proxiedUrls[index]!
  const total = imageUrls.length
  const showArrows = total > 1

  useEffect(() => {
    setImageLoading(true)
  }, [current])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Rounded bordered container */}
      <div className="relative flex max-h-[90vh] max-w-[90vw] flex-1 flex-col overflow-hidden rounded-2xl border-2 border-[#3a424a] bg-[#1a1e22] shadow-2xl">
        {/* Close button */}
        <div className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#e31337]"
            aria-label="Close preview"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image area with swipe */}
        <div
          className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center p-4"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {imageLoading && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-[#1a1e22]">
              <Loader2 className="h-12 w-12 animate-spin text-[#e31337]" aria-hidden />
            </div>
          )}
          <img
            src={current}
            alt={`Image ${index + 1} of ${total}`}
            className="max-h-full max-w-full select-none object-contain"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.style.display = 'none'
              setImageLoading(false)
            }}
          />
          {showArrows && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Pager */}
        {total > 1 && (
          <div className="shrink-0 border-t border-[#3a424a] py-3 text-center text-sm text-[#9ca3b0]">
            {index + 1} / {total}
          </div>
        )}
      </div>
    </div>
  )
}
