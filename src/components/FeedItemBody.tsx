/**
 * Feed item body: plain text with clickable links and hashtags, plus media blocks.
 * Links open in new tab (or in-app on iOS). Hashtags navigate to /tags/:tag.
 */
import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { NormalizedPost } from '../utils/types'
import type { ParsedPostBody } from '../utils/postBody'
import { parsePostBody, parseBodyFromMarkdown, plainTextToSegments } from '../utils/postBody'
import { openLink } from '../utils/openLink'
import { ImageCarousel } from './ImageCarousel'
import { ThreeSpeakPlayer } from './ThreeSpeakPlayer'

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
        <div key={id} className="my-3 overflow-hidden rounded-lg">
          <iframe
            src={`https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark`}
            title={`Tweet ${id}`}
            className="h-[440px] w-full max-w-[550px] border-0"
            loading="lazy"
          />
        </div>
      ))}

      {parsed.youtubeVideoIds.map((id) => (
        <div key={id} className="my-3 overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={`https://www.youtube.com/embed/${id}`}
            title="YouTube video"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
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
