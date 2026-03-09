/**
 * Header dropdown: feed filter (Newest, Trending; when logged in: Following Feeds, My feed).
 */
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useFeedFilterStore, type FeedFilterMode } from '../stores/feedFilterStore'
import { useAuthData } from '../stores/authStore'
import { useFollowingStore } from '../stores/followingStore'

const FILTER_LABELS: Record<FeedFilterMode, string> = {
  newest: 'Newest',
  trending: 'Trending',
  following: 'Following Feeds',
  my_feed: 'My feed',
}

export function FeedFilterDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { feedFilter, setFeedFilter } = useFeedFilterStore()
  const { isAuthenticated, username } = useAuthData()
  const fetchFollowings = useFollowingStore((s) => s.fetchFollowings)

  const options: FeedFilterMode[] = isAuthenticated
    ? ['newest', 'trending', 'following', 'my_feed']
    : ['newest', 'trending']

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[#3a424a] bg-[#262b30] px-3 py-2 text-sm font-medium text-[#f0f0f8] hover:bg-[#2f353d] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Feed filter: ${FILTER_LABELS[feedFilter]}`}
      >
        {FILTER_LABELS[feedFilter]}
        <ChevronDown className={`h-4 w-4 text-[#9ca3b0] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[#3a424a] bg-[#262b30] py-1 shadow-lg"
          aria-label="Feed filter options"
        >
          {options.map((mode) => (
            <li key={mode} role="option" aria-selected={feedFilter === mode}>
              <button
                type="button"
                onClick={() => {
                  setFeedFilter(mode)
                  if (mode === 'following' && username) {
                    fetchFollowings(username).catch(() => {})
                  }
                  setOpen(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  feedFilter === mode
                    ? 'bg-[#e31337]/20 text-[#e31337] font-medium'
                    : 'text-[#f0f0f8] hover:bg-[#2f353d]'
                }`}
              >
                {FILTER_LABELS[mode]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
