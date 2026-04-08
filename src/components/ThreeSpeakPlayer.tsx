/**
 * 3Speak video player for author/permlink. Used when markdown contains 3speak.tv links.
 * Uses the official iframe embed instead of the HTML5 HLS player to reduce memory usage.
 */

interface ThreeSpeakPlayerProps {
  author: string
  permlink: string
  className?: string
}

export function ThreeSpeakPlayer({ author, permlink, className = '' }: ThreeSpeakPlayerProps) {
  const videoParam = encodeURIComponent(`${author}/${permlink}`)
  const src = `https://play.3speak.tv/embed?v=${videoParam}&mode=iframe&noscroll=1`

  return (
    <div
      className={`three-speak-embed my-3 overflow-hidden rounded-lg bg-black/40 p-3 ${className}`}
      style={{ aspectRatio: '9/16', maxWidth: '380px', margin: '0 auto' }}
    >
      <iframe
        src={src}
        title={`3Speak video by ${author}`}
        className="h-full w-full border-0"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
