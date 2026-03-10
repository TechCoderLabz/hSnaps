/**
 * Single-image carousel with left/right swipe and dot pager.
 * Thumbnails use Hive image proxy (250x0) for bandwidth; lightbox uses original URLs.
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { ImageLightbox } from './ImageLightbox'
import { getHiveProxyThumbnailUrl } from '../utils/imageProxy'

export interface ImageCarouselProps {
  imageUrls: string[]
  className?: string
  imageClassName?: string
}

const SWIPE_THRESHOLD_PX = 40

export function ImageCarousel({ imageUrls, className = '', imageClassName = '' }: ImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const touchStartX = useRef<number | null>(null)
  const touchSwipeHandled = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const dragSwipeHandled = useRef(false)
  const didSwipeRef = useRef(false)

  const goTo = useCallback(
    (next: number) => {
      const n = imageUrls.length
      if (n <= 0) return
      setIndex((i) => {
        const j = next < 0 ? i + next : next >= n ? i : next
        return Math.max(0, Math.min(n - 1, j))
      })
    },
    [imageUrls.length]
  )

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
        didSwipeRef.current = true
        setTimeout(() => { didSwipeRef.current = false }, 300)
        if (dx > 0) goTo(index + 1)
        else goTo(index - 1)
        touchStartX.current = null
      }
    },
    [index, goTo]
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
        didSwipeRef.current = true
        setTimeout(() => { didSwipeRef.current = false }, 300)
        if (dx > 0) goTo(index + 1)
        else goTo(index - 1)
        dragStartX.current = null
      }
    },
    [index, goTo]
  )

  const onPointerUp = useCallback(() => {
    dragStartX.current = null
    dragSwipeHandled.current = false
  }, [])

  const onPointerLeave = useCallback(() => {
    dragStartX.current = null
    dragSwipeHandled.current = false
  }, [])

  const current = imageUrls[index]!
  const total = imageUrls.length
  const thumbnailUrl = getHiveProxyThumbnailUrl(current)
  const showArrows = total > 1

  useEffect(() => {
    setImageLoading(true)
  }, [thumbnailUrl])

  if (imageUrls.length === 0) return null

  const IMAGE_HEIGHT = 260
  const PAGER_HEIGHT = 28
  const TOTAL_HEIGHT = IMAGE_HEIGHT + PAGER_HEIGHT

  return (
    <div
      className={`flex shrink-0 flex-col overflow-hidden ${className}`}
      style={{ height: TOTAL_HEIGHT }}
    >
      <div
        className="relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden select-none bg-[#1a1e22] touch-pan-y"
        style={{ touchAction: 'pan-y', height: IMAGE_HEIGHT }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerUp}
        onClick={() => {
          if (!didSwipeRef.current) setLightboxOpen(true)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setLightboxOpen(true)}
        aria-label="View full size"
      >
        {imageLoading && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-[#1a1e22]">
            <Loader2 className="h-10 w-10 animate-spin text-[#e31337]" aria-hidden />
          </div>
        )}
        <img
          src={thumbnailUrl}
          alt={`Slide ${index + 1} of ${total}`}
          className={`max-h-full max-w-full object-contain ${imageClassName}`}
          loading="lazy"
          draggable={false}
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
                goTo(index - 1)
              }}
              className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 sm:left-2"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goTo(index + 1)
              }}
              className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 sm:right-2"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          imageUrls={imageUrls}
          initialIndex={index}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="flex shrink-0 items-center justify-center gap-2" style={{ minHeight: PAGER_HEIGHT }}>
      {total > 1 ? (
        <>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Image pager">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === index
                    ? 'w-5 bg-[#e31337]'
                    : 'w-2 bg-[#505863] hover:bg-[#6b7280]'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-[#9ca3b0] tabular-nums" aria-live="polite">
            {index + 1} / {total}
          </span>
        </>
      ) : null}
      </div>
    </div>
  )
}
