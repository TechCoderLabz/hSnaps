import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface CommentSearchBarProps {
  isVisible: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onClose: () => void
}

export function CommentSearchBar({
  isVisible,
  searchQuery,
  onSearchChange,
  onClose,
}: CommentSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  const handleClear = () => {
    onSearchChange('')
    onClose()
  }

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isVisible ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="border-b border-[#3a424a] bg-[#20262c] p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search comments and authors..."
            className="w-full rounded-lg border border-zinc-700 bg-[#1c2127] py-2 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-[#e31337] focus:ring-2 focus:ring-[#e31337]/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-1 transition hover:bg-zinc-800"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition hover:bg-zinc-800"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

