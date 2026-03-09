/**
 * 3Speak video player for author/permlink. Used when markdown contains 3speak.tv links.
 * Wraps the player ref to catch "Player is destroyed" when ref is called after unmount cleanup.
 * This uses the lightweight `@mantequilla-soft/3speak-player` HTML5 player (video element only),
 * not the full 3Speak page with description/comments.
 */
import { useCallback, useEffect, useRef } from 'react'
import { usePlayer } from '@mantequilla-soft/3speak-player/react'
import { useVideoPlaybackStore } from '../stores/videoPlaybackStore'

interface ThreeSpeakPlayerProps {
  author: string
  permlink: string
  className?: string
}

export function ThreeSpeakPlayer({ author, permlink, className = '' }: ThreeSpeakPlayerProps) {
  const videoKey = `3speak:${author}/${permlink}`
  const currentId = useVideoPlaybackStore((s) => s.currentId)
  const setCurrentId = useVideoPlaybackStore((s) => s.setCurrentId)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const { ref: playerRef } = usePlayer({
    autoLoad: `${author}/${permlink}`,
    muted: true,
    loop: false,
  })

  const safeRef = useCallback(
    (el: HTMLVideoElement | null) => {
      try {
        videoRef.current = el
        playerRef(el)
      } catch (e) {
        if (e instanceof Error && e.message !== 'Player is destroyed') throw e
      }
    },
    [playerRef]
  )

  useEffect(() => {
    if (!videoRef.current) return
    // When another video becomes current, pause this one.
    if (currentId !== videoKey && !videoRef.current.paused) {
      videoRef.current.pause()
    }
  }, [currentId, videoKey])

  return (
    <div
      className={`my-3 overflow-hidden rounded-lg bg-black ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={safeRef}
        playsInline
        controls
        onPlay={() => setCurrentId(videoKey)}
        className="h-full w-full max-w-full object-contain"
      />
    </div>
  )
}
