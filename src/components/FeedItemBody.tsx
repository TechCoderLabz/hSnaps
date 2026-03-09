/**
 * Feed item body: plain text with clickable links and hashtags, plus media blocks.
 * Links open in new tab (or in-app on iOS). Hashtags navigate to /tags/:tag.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { NormalizedPost } from '../utils/types'
import type { ParsedPostBody } from '../utils/postBody'
import { parsePostBody, plainTextToSegments } from '../utils/postBody'
import { openLink } from '../utils/openLink'
import { ImageCarousel } from './ImageCarousel'
import { ThreeSpeakPlayer } from './ThreeSpeakPlayer'
import { useVideoPlaybackStore } from '../stores/videoPlaybackStore'

function LinkSegment({ url }: { url: string }) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      void openLink(url)
    },
    [url]
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

function YoutubeEmbed({ id }: { id: string }) {
  const [active, setActive] = useState(false)
  const videoKey = `youtube:${id}`
  const currentId = useVideoPlaybackStore((s) => s.currentId)
  const setCurrentId = useVideoPlaybackStore((s) => s.setCurrentId)

  useEffect(() => {
    if (!active) return
    if (currentId !== videoKey) {
      setActive(false)
    }
  }, [active, currentId, videoKey])
  const thumbUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  if (!active) {
    return (
      <button
        type="button"
        className="my-3 flex w-full items-center justify-center overflow-hidden rounded-lg bg-black/60"
        style={{ aspectRatio: '16/9' }}
        onClick={() => {
          setCurrentId(videoKey)
          setActive(true)
        }}
      >
        <div className="relative h-full w-full">
          <img
            src={thumbUrl}
            alt="YouTube video thumbnail"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
              <Play className="ml-0.5 h-7 w-7" />
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
        title="YouTube video"
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function TwitterEmbed({ id }: { id: string }) {
  const [active, setActive] = useState(false)
  const videoKey = `twitter:${id}`
  const currentId = useVideoPlaybackStore((s) => s.currentId)
  const setCurrentId = useVideoPlaybackStore((s) => s.setCurrentId)

  useEffect(() => {
    if (!active) return
    if (currentId !== videoKey) {
      setActive(false)
    }
  }, [active, currentId, videoKey])

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => {
          setCurrentId(videoKey)
          setActive(true)
        }}
        className="my-3 flex w-full items-center justify-between rounded-lg border border-[#3a424a] bg-[#0f172a] px-4 py-3 text-left text-sm text-[#e5e7eb] hover:bg-[#111827]"
      >
        <div className="flex flex-col">
          <span className="font-semibold text-[#f9fafb]">Load Tweet</span>
          <span className="text-xs text-[#9ca3b0]">Tap to load the embedded tweet (saves data).</span>
        </div>
        <span className="text-xs font-medium text-[#60a5fa]">Show</span>
      </button>
    )
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg">
      <iframe
        src={`https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark`}
        title={`Tweet ${id}`}
        className="w-full border-0"
      />
    </div>
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

export interface ParsedBodyContentProps {
  parsed: ParsedPostBody
  /** When true, hide image carousel (e.g. when 3speak is present). */
  hideImages?: boolean
  /** When set, highlight matching text in content (e.g. comment search). */
  highlightQuery?: string
  className?: string
}

/** Renders parsed body: carousel, plain text with links/hashtags, 3speak, Twitter, YouTube. Same style as dashboard feed. */
export function ParsedBodyContent({
  parsed,
  hideImages = false,
  highlightQuery,
  className = '',
}: ParsedBodyContentProps) {
  return (
    <div className={`feed-item-body space-y-2 ${className}`}>
      {!hideImages && parsed.imageUrls.length > 0 && (
        <div className="post-card-grid-media mb-2">
          <ImageCarousel imageUrls={parsed.imageUrls} imageClassName="rounded-lg" />
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
            ) : (
              <HashtagSegment key={i} tag={seg.tag} />
            )
          )}
        </div>
      )}

      {parsed.threeSpeakUrls.map(({ author, permlink }) => (
        <ThreeSpeakPlayer key={`${author}/${permlink}`} author={author} permlink={permlink} />
      ))}

      {parsed.twitterStatusIds.map((id) => (
        <TwitterEmbed key={id} id={id} />
      ))}

      {parsed.youtubeVideoIds.map((id) => (
        <YoutubeEmbed key={id} id={id} />
      ))}
    </div>
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
