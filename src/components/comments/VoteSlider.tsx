import { useState } from 'react'
import { ThumbsUp, X, Loader2 } from 'lucide-react'

interface VoteSliderProps {
  author: string
  permlink?: string
  defaultValue?: number
  onUpvote: (percent: number) => Promise<void> | void
  onCancel: () => void
}

export function VoteSlider({
  author,
  defaultValue = 100,
  onUpvote,
  onCancel,
}: VoteSliderProps) {
  const [percent, setPercent] = useState(defaultValue)
  const [loading, setLoading] = useState(false)
  const stops = [1, ...Array.from({ length: 10 }, (_, i) => (i + 1) * 10)]

  const handleVoteClick = async () => {
    if (percent === 0 || loading) return
    setLoading(true)
    try {
      await onUpvote(percent)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#262b30] p-5 shadow-xl sm:p-6 flex flex-col border border-[#3a424a]">
        <h2 className="mb-6 text-center text-base font-semibold text-[#f0f0f8] sm:text-lg">
          Vote for @{author}
        </h2>

        <div className="relative mb-8 flex w-full flex-col items-center">
          <div
            className="absolute -top-8 left-0"
            style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
          >
            <div className="rounded-lg bg-[#e31337] px-2 py-1 text-xs text-white shadow sm:text-sm">
              {percent}%
            </div>
            <div className="mx-auto -mt-1 h-2 w-2 rotate-45 bg-[#e31337]" />
          </div>

          <input
            type="range"
            min={1}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-[#e31337]"
          />

          <div className="mt-3 ml-2 flex w-full justify-between text-[10px] text-zinc-400 sm:text-xs">
            {stops.map((stop) => (
              <button
                type="button"
                key={stop}
                onClick={() => setPercent(stop)}
                className={`rounded px-1 transition focus:outline-none ${
                  percent === stop
                    ? 'font-bold text-[#e31337]'
                    : 'hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {stop}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleVoteClick}
            disabled={percent === 0 || loading}
            className={`flex flex-1 items-center justify-center rounded-full px-3 py-2 text-sm font-semibold shadow transition sm:px-4 sm:py-3 sm:text-base ${
              percent === 0 || loading
                ? 'cursor-not-allowed bg-[#e31337]/40 text-white'
                : 'bg-[#e31337] text-white hover:bg-[#c81131]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                Voting...
              </>
            ) : (
              <>
                <ThumbsUp className="mr-1 h-4 w-4 sm:h-5 sm:w-5" />
                Vote
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex flex-1 items-center justify-center rounded-full bg-zinc-600 px-3 py-2 text-sm font-semibold text-zinc-50 shadow transition hover:bg-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <X className="mr-1 h-4 w-4 sm:h-5 sm:w-5" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

