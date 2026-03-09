/**
 * 3Speak video player for author/permlink. Used when markdown contains 3speak.tv links.
 * Wraps the player ref to catch "Player is destroyed" when ref is called after unmount cleanup.
 */
import { useCallback } from 'react'
import { usePlayer } from '@mantequilla-soft/3speak-player/react'

interface ThreeSpeakPlayerProps {
  author: string
  permlink: string
  className?: string
}

export function ThreeSpeakPlayer({ author, permlink, className = '' }: ThreeSpeakPlayerProps) {
  const { ref: playerRef } = usePlayer({
    autoLoad: `${author}/${permlink}`,
    muted: true,
    loop: false,
  })

  const safeRef = useCallback(
    (el: HTMLVideoElement | null) => {
      try {
        playerRef(el)
      } catch (e) {
        if (e instanceof Error && e.message !== 'Player is destroyed') throw e
      }
    },
    [playerRef]
  )

  return (
    <div className={`my-3 overflow-hidden rounded-lg bg-black ${className}`}>
      <video
        ref={safeRef}
        playsInline
        controls
        className="h-auto w-full max-w-full"
        style={{ maxHeight: 360 }}
      />
    </div>
  )
}
