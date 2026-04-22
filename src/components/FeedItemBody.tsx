/**
 * Feed item body: plain text with clickable links/hashtags/mentions, plus a unified
 * swipeable attachment strip. Heavy embeds (YouTube, Twitter, 3Speak, audio) render as
 * lightweight placeholders; tapping opens a popup that loads the actual embed on demand.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, X, ChevronLeft, ChevronRight, Music } from 'lucide-react'
import type { NormalizedPost } from '../utils/types'
import type { ParsedPostBody } from '../utils/postBody'
import { parsePostBody, plainTextToSegments } from '../utils/postBody'
import { openLink } from '../utils/openLink'
import { parseHiveFrontendUrl } from 'hive-react-kit'
import { ImageLightbox } from './ImageLightbox'
import { ThreeSpeakPlayer } from './ThreeSpeakPlayer'
import { HtmlWith3Speak } from './HtmlWith3Speak'
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer'
import { getHiveProxyThumbnailUrl, proxyImageUrl } from '../utils/imageProxy'
import { useVideoPlaybackStore } from '../stores/videoPlaybackStore'

/* ------------------------------------------------------------------ */
/*  Shared text helpers                                               */
/* ------------------------------------------------------------------ */

function LinkSegment({ url }: { url: string }) {
  const navigate = useNavigate()
  const hiveTarget = useMemo(() => parseHiveFrontendUrl(url), [url])
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (hiveTarget?.kind === 'post') {
        navigate(`/@${hiveTarget.author}/${hiveTarget.permlink}`)
        return
      }
      if (hiveTarget?.kind === 'user') {
        navigate(`/@${hiveTarget.author}`)
        return
      }
      void openLink(url)
    },
    [hiveTarget, navigate, url]
  )
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="text-[#e31337] underline break-all hover:text-[#c51231]"
    >
      {url}
    </a>
  )
}

function HashtagSegment({ tag }: { tag: string }) {
  return (
    <Link
      to={`/tags/${encodeURIComponent(tag)}`}
      className="text-[#e31337] underline hover:text-[#c51231]"
    >
      #{tag}
    </Link>
  )
}

function MentionSegment({ username }: { username: string }) {
  return (
    <Link
      to={`/@${username}`}
      className="text-[#e31337] underline hover:text-[#c51231]"
    >
      @{username}
    </Link>
  )
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const parts: React.ReactNode[] = []
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index))
    parts.push(<mark key={parts.length} className="bg-amber-500/30 rounded px-0.5">{m[1]}</mark>)
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : text
}

/* ------------------------------------------------------------------ */
/*  Unified attachment model                                          */
/* ------------------------------------------------------------------ */

type Attachment =
  | { kind: 'image'; url: string }
  | { kind: 'youtube'; id: string }
  | { kind: 'twitter'; id: string }
  | { kind: '3speak'; author: string; permlink: string }
  | { kind: '3speak-audio'; url: string }
  | { kind: 'audio'; url: string }

function buildAttachments(parsed: ParsedPostBody): Attachment[] {
  const out: Attachment[] = []
  for (const url of parsed.imageUrls) out.push({ kind: 'image', url })
  for (const { author, permlink } of parsed.threeSpeakUrls) out.push({ kind: '3speak', author, permlink })
  for (const url of parsed.threeSpeakAudioUrls) out.push({ kind: '3speak-audio', url })
  for (const url of parsed.audioFileUrls ?? []) out.push({ kind: 'audio', url })
  for (const id of parsed.twitterStatusIds) out.push({ kind: 'twitter', id })
  for (const id of parsed.youtubeVideoIds) out.push({ kind: 'youtube', id })
  return out
}

function attachmentLabel(a: Attachment): string {
  switch (a.kind) {
    case 'image': return 'Image'
    case 'youtube': return 'YouTube video'
    case 'twitter': return 'Tweet'
    case '3speak': return '3Speak video'
    case '3speak-audio': return '3Speak audio'
    case 'audio': return 'Audio'
  }
}

function AttachmentIcon({ kind }: { kind: Attachment['kind'] }) {
  const cls = 'h-5 w-5'
  switch (kind) {
    case 'youtube': return <Play className={cls} />
    case 'twitter': return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
    case '3speak': return <Play className={cls} />
    case '3speak-audio': return <Music className={cls} />
    case 'audio': return <Music className={cls} />
    default: return null
  }
}

/* ------------------------------------------------------------------ */
/*  Twitter embed                                                     */
/* ------------------------------------------------------------------ */

function TwitterEmbed({ id }: { id: string }) {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (!d || typeof d !== 'object') return
        let h: number | undefined
        if (d.method === 'resize' && Array.isArray(d.params)) {
          for (const p of d.params) {
            if (typeof p === 'number' && p > 0) h = p
            if (p && typeof p === 'object' && typeof p.height === 'number') h = p.height
          }
        }
        if (d['twttr.private.resize']?.height) h = d['twttr.private.resize'].height
        if (!h && typeof d.height === 'number') h = d.height
        if (!h && d.msg_type === 'resize' && d.msg_data?.height) h = d.msg_data.height
        if (h && h > 50) setHeight(Math.ceil(h))
      } catch { /* ignore */ }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div
      className="twitter-embed-wrapper w-full rounded-lg flex items-center justify-center bg-black/60 overflow-hidden"
      style={height ? { maxHeight: '80vh', overflowY: 'auto' } : undefined}
    >
      <iframe
        src={`https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark&dnt=true&origin=${encodeURIComponent(origin)}`}
        title={`Tweet ${id}`}
        className="twitter-embed-iframe w-full border-0 flex-shrink-0 justify-self-start items-center bg-black"
        scrolling="yes"
        style={{ height: height ?? '60vh' }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Placeholder card for heavy content                                */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_BG: Record<Attachment['kind'], string> = {
  image: '',
  youtube: 'bg-gradient-to-br from-red-900/40 to-red-950/60',
  twitter: 'bg-gradient-to-br from-sky-900/40 to-slate-950/60',
  '3speak': 'bg-gradient-to-br from-purple-900/40 to-purple-950/60',
  '3speak-audio': 'bg-gradient-to-br from-violet-900/40 to-violet-950/60',
  audio: 'bg-gradient-to-br from-emerald-900/40 to-emerald-950/60',
}

function PlaceholderCard({ attachment, onClick }: { attachment: Attachment; onClick: () => void }) {
  if (attachment.kind === 'youtube') {
    const thumbUrl = proxyImageUrl(`https://img.youtube.com/vi/${attachment.id}/mqdefault.jpg`, 320)
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/60"
        aria-label={`Play ${attachmentLabel(attachment)}`}
      >
        <img src={thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
            <Play className="ml-0.5 h-5 w-5" />
          </div>
          <span className="mt-1.5 text-[10px] font-medium text-white/80">Tap to play</span>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full w-full shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#3a424a]/60 ${PLACEHOLDER_BG[attachment.kind]}`}
      aria-label={`Open ${attachmentLabel(attachment)}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70">
        <AttachmentIcon kind={attachment.kind} />
      </div>
      <span className="text-xs font-medium text-white/70">{attachmentLabel(attachment)}</span>
      <span className="text-[10px] text-white/40">Tap to preview</span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Media popup – lazy-loads actual embed                             */
/* ------------------------------------------------------------------ */

function MediaPopup({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) {
  const setCurrentId = useVideoPlaybackStore((s) => s.setCurrentId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    // Lock body scroll while popup is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // Register with video playback store for single-playback management
  useEffect(() => {
    if (attachment.kind === 'youtube') setCurrentId(`youtube:${attachment.id}`)
    else if (attachment.kind === 'twitter') setCurrentId(`twitter:${attachment.id}`)
    else if (attachment.kind === '3speak') setCurrentId(`3speak:${attachment.author}/${attachment.permlink}`)
    return () => setCurrentId(null)
  }, [attachment, setCurrentId])

  // Mobile: fullscreen. Tablet/desktop: fit content, center it.
  const isCompact = attachment.kind === 'audio' || attachment.kind === '3speak-audio'

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const closeAndStop = (e: React.SyntheticEvent) => { e.stopPropagation(); onClose() }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/80 sm:items-center sm:justify-center sm:bg-black/85 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={closeAndStop}
      onPointerDown={stop}
      onTouchEnd={stop}
    >
      {/* Mobile title strip — safe-area + app-header clearance */}
      <div
        className="flex shrink-0 items-center bg-black/40 px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+4rem)] sm:hidden"
        onClick={stop}
      >
        <span className="truncate text-sm font-medium text-white/80">{attachmentLabel(attachment)}</span>
      </div>

      {/* Floating close button (mobile) — stays above iframe content, always tappable */}
      <button
        type="button"
        onClick={closeAndStop}
        onPointerDown={stop}
        className="fixed right-3 top-[calc(env(safe-area-inset-top,0px)+4rem)] z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white shadow-lg ring-1 ring-white/30 transition hover:bg-black sm:hidden"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Content container — fullscreen on mobile, fitted card on sm+ */}
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#1a1e22] shadow-2xl sm:flex-initial sm:overflow-visible sm:rounded-2xl sm:border sm:border-[#3a424a] ${
          isCompact ? 'sm:max-w-md' : 'sm:max-w-2xl'
        } sm:w-full`}
      >
        {/* Desktop close button — outside iframe area */}
        <div
          className="hidden shrink-0 items-center justify-between border-b border-[#3a424a]/60 px-4 py-2.5 sm:flex"
          onClick={stop}
        >
          <span className="text-sm font-medium text-white/70">{attachmentLabel(attachment)}</span>
          <button
            type="button"
            onClick={closeAndStop}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-3 sm:p-4">
          {attachment.kind === 'youtube' && (
            <div
              className="w-full overflow-hidden rounded-lg"
              style={{ aspectRatio: '16/9' }}
              onClick={stop}
            >
              <iframe
                src={`https://www.youtube.com/embed/${attachment.id}?autoplay=1&rel=0`}
                title="YouTube video"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {attachment.kind === 'twitter' && (
            <div className="w-full" onClick={stop}>
              <TwitterEmbed id={attachment.id} />
            </div>
          )}

          {attachment.kind === '3speak' && (
            <div className="w-full" onClick={stop}>
              <ThreeSpeakPlayer author={attachment.author} permlink={attachment.permlink} />
            </div>
          )}

          {attachment.kind === '3speak-audio' && (
            <div
              className="w-full overflow-hidden rounded-lg border border-[#3a424a] bg-[#1a1d21]"
              onClick={stop}
            >
              <iframe
                src={attachment.url}
                title="3Speak audio"
                className="h-24 w-full border-0"
                allow="autoplay"
              />
            </div>
          )}

          {attachment.kind === 'audio' && (() => {
            const fileName = decodeURIComponent(attachment.url.split('/').pop()?.split('?')[0] ?? 'Audio')
            return (
              <div
                className="w-full overflow-hidden rounded-xl border border-[#3a424a] bg-[#1a1d21] p-3"
                onClick={stop}
              >
                <div className="mb-2 flex items-center gap-2 text-sm text-[#9ca3b0]">
                  <Music className="h-4 w-4 shrink-0 text-[#e31337]" />
                  <span className="truncate">{fileName}</span>
                </div>
                <audio src={attachment.url} controls preload="metadata" className="w-full h-10" autoPlay />
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Image lightbox integration for image attachments                  */
/* ------------------------------------------------------------------ */

function ImageThumbnail({
  url,
  onClick,
}: {
  url: string
  onClick: () => void
}) {
  const thumbUrl = getHiveProxyThumbnailUrl(url)
  const [src, setSrc] = useState(thumbUrl)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSrc(thumbUrl)
    setLoaded(false)
  }, [thumbUrl])

  const handleError = () => {
    if (src !== url) {
      setSrc(url)
    } else {
      setLoaded(true)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#1a1e22]"
      aria-label="View image"
    >
      {!loaded && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-[#1a1e22]">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#e31337] border-t-transparent" />
        </div>
      )}
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain"
        loading="lazy"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Swipeable attachment strip                                        */
/* ------------------------------------------------------------------ */

const STRIP_HEIGHT = 280
const SWIPE_THRESHOLD = 40

function AttachmentStrip({
  attachments,
  imageUrls,
}: {
  attachments: Attachment[]
  imageUrls: string[]
}) {
  const [index, setIndex] = useState(0)
  const [popupAttachment, setPopupAttachment] = useState<Attachment | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchHandled = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const dragHandled = useRef(false)

  const total = attachments.length
  const current = attachments[index]
  if (!current) return null

  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => setIndex((i) => Math.min(total - 1, i + 1))

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
    touchHandled.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchHandled.current) return
    const x = e.targetTouches[0]?.clientX ?? touchStartX.current
    const dx = touchStartX.current - x
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      touchHandled.current = true
      if (dx > 0) goNext(); else goPrev()
      touchStartX.current = null
    }
  }
  const onTouchEnd = () => { touchStartX.current = null; touchHandled.current = false }

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
    dragHandled.current = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current == null || e.buttons !== 1 || dragHandled.current) return
    const dx = dragStartX.current - e.clientX
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      dragHandled.current = true
      if (dx > 0) goNext(); else goPrev()
      dragStartX.current = null
    }
  }
  const onPointerUp = () => { dragStartX.current = null; dragHandled.current = false }

  const handleTap = (a: Attachment) => {
    if (a.kind === 'image') {
      // Find this image's position among all images for lightbox navigation
      const imgIndex = imageUrls.indexOf(a.url)
      setLightboxIndex(imgIndex >= 0 ? imgIndex : 0)
      setLightboxOpen(true)
    } else {
      setPopupAttachment(a)
    }
  }

  return (
    <>
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ height: STRIP_HEIGHT }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Current slide */}
        <div className="h-full w-full" style={{ touchAction: 'pan-y' }}>
          {current.kind === 'image' ? (
            <ImageThumbnail url={current.url} onClick={() => handleTap(current)} />
          ) : (
            <PlaceholderCard attachment={current} onClick={() => handleTap(current)} />
          )}
        </div>

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            {index > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Previous attachment"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {index < total - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Next attachment"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        )}

        {/* Position indicator */}
        {total > 1 && (
          <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
            {attachments.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index ? 'w-4 bg-[#e31337]' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`Go to attachment ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {lightboxOpen && imageUrls.length > 0 && (
        <ImageLightbox
          imageUrls={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Heavy-content popup */}
      {popupAttachment && (
        <MediaPopup attachment={popupAttachment} onClose={() => setPopupAttachment(null)} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Public API – ParsedBodyContent & FeedItemBody                     */
/* ------------------------------------------------------------------ */

export interface ParsedBodyContentProps {
  parsed: ParsedPostBody
  /** When true, hide image carousel (e.g. when 3speak is present). */
  hideImages?: boolean
  /** When 'grid', show images in a side-by-side grid (e.g. composer preview). Default 'carousel'. */
  imageLayout?: 'carousel' | 'grid'
  /** When set, highlight matching text in content (e.g. comment search). */
  highlightQuery?: string
  className?: string
}

/** Renders parsed body: text with links/hashtags + unified swipeable attachment strip. */
export function ParsedBodyContent({
  parsed,
  hideImages = false,
  imageLayout = 'carousel',
  highlightQuery,
  className = '',
}: ParsedBodyContentProps) {
  const attachments = useMemo(() => buildAttachments(parsed), [parsed])

  // For grid layout (e.g. composer preview), keep the old simple rendering
  if (imageLayout === 'grid') {
    return (
      <div className={`feed-item-body space-y-2 ${className}`}>
        {!hideImages && parsed.imageUrls.length > 0 && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            {parsed.imageUrls.map((url) => (
              <img
                key={url}
                src={proxyImageUrl(url, 400)}
                alt=""
                className="rounded-lg object-cover w-full aspect-square max-h-40"
                loading="lazy"
              />
            ))}
          </div>
        )}
        {parsed.plainText && (
          <div className="whitespace-pre-line break-words text-sm leading-relaxed text-zinc-300">
            {plainTextToSegments(parsed.plainText).map((seg, i) =>
              seg.type === 'text' ? (
                <span key={i}>
                  {highlightQuery ? highlightText(seg.value, highlightQuery) : seg.value}
                </span>
              ) : seg.type === 'link' ? (
                <LinkSegment key={i} url={seg.url} />
              ) : seg.type === 'hashtag' ? (
                <HashtagSegment key={i} tag={seg.tag} />
              ) : (
                <MentionSegment key={i} username={seg.username} />
              )
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`feed-item-body space-y-2 ${className}`}>
      {/* Unified attachment strip */}
      {attachments.length > 0 && (
        <div className="mb-2">
          <AttachmentStrip attachments={attachments} imageUrls={parsed.imageUrls} />
        </div>
      )}

      {/* Markdown body — preserves bold/italic/tables/headings/lists at small size */}
      {parsed.bodyForMarkdown && (
        <MarkdownBody markdown={parsed.bodyForMarkdown} />
      )}
    </div>
  )
}

function MarkdownBody({ markdown }: { markdown: string }) {
  const render = useMarkdownRenderer()
  const html = useMemo(() => render(markdown), [markdown, render])
  return (
    <HtmlWith3Speak
      html={html}
      className="markdown-preview feed-markdown break-words text-sm leading-relaxed text-zinc-300"
    />
  )
}

interface FeedItemBodyProps {
  post: NormalizedPost
  /** When true, hide image carousel (e.g. when 3speak is present and we don't show images). */
  hideImages?: boolean
}

export function FeedItemBody({ post, hideImages = false }: FeedItemBodyProps) {
  const parsed = useMemo(() => parsePostBody(post), [post])
  return <ParsedBodyContent parsed={parsed} hideImages={hideImages} />
}
