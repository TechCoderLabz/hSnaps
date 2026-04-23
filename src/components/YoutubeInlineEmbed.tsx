/**
 * Inline YouTube player used by HtmlWith3Speak. Shows a thumbnail with a
 * play button; tapping swaps it for the in-app iframe so the user never
 * leaves hsnaps (native YouTube intent hand-off on Capacitor was the
 * previous behaviour for markdown-authored YouTube links).
 */
import { useState } from 'react'
import { Play } from 'lucide-react'
import { proxyImageUrl } from '../utils/imageProxy'

/** Extract a YouTube video id from any common URL format. Returns null if not YouTube. */
export function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id || null
    }
    if (host.endsWith('youtube.com')) {
      if (u.pathname === '/watch') {
        return u.searchParams.get('v')
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.slice('/shorts/'.length).split('/')[0]
        return id || null
      }
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.slice('/embed/'.length).split('/')[0]
        return id || null
      }
    }
    return null
  } catch {
    return null
  }
}

interface YoutubeInlineEmbedProps {
  videoId: string
}

export function YoutubeInlineEmbed({ videoId }: YoutubeInlineEmbedProps) {
  const [playing, setPlaying] = useState(false)
  const thumb = proxyImageUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, 640)

  return (
    <div
      className="my-2 w-full overflow-hidden rounded-lg border border-[#3a424a] bg-black"
      style={{ aspectRatio: '16/9' }}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
          title="YouTube video"
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setPlaying(true)
          }}
          className="relative flex h-full w-full items-center justify-center"
          aria-label="Play YouTube video"
        >
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/30">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
              <Play className="ml-1 h-6 w-6 fill-current" />
            </span>
          </div>
        </button>
      )}
    </div>
  )
}
