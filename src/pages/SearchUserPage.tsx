import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, User, X } from 'lucide-react'

type LookupResult = string[]

export function SearchUserPage() {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('https://api.hive.blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 0,
          jsonrpc: '2.0',
          method: 'condenser_api.lookup_accounts',
          params: [query, 10],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = (await response.json()) as {
        result?: LookupResult
        error?: { message?: string }
      }

      if (data.error) {
        throw new Error(data.error.message || 'Search failed')
      }

      setSearchResults(Array.isArray(data.result) ? data.result : [])
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void searchUsers(searchQuery)
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [searchQuery, searchUsers])

  const handleUserSelect = (username: string) => {
    try {
      sessionStorage.setItem('hsnaps_prev_route', '/dashboard/search-user')
    } catch {
      // ignore
    }
    navigate(`/user/${username}`)
  }

  const renderSearchState = () => {
    if (error) {
      return (
        <div className="mb-4">
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="py-8 text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-[#e31337]" />
          <p className="text-sm text-[#9ca3b0]">Searching users...</p>
        </div>
      )
    }

    if (!isLoading && searchQuery && searchResults.length === 0) {
      return (
        <div className="py-8 text-center text-[#9ca3b0]">
          <User className="mx-auto mb-3 h-12 w-12 text-[#4b5563]" />
          <p>
            No users found for "<span className="font-medium text-[#e7e7f1]">{searchQuery}</span>"
          </p>
        </div>
      )
    }

    if (!isLoading && !error && !searchQuery) {
      return (
        <div className="py-8 text-center text-[#9ca3b0]">
          <SearchIcon className="mx-auto mb-3 h-12 w-12 text-[#4b5563]" />
          <p>Start typing to search for users</p>
        </div>
      )
    }

    if (!isLoading && !error && searchResults.length > 0) {
      return (
        <div className="space-y-2">
          {searchResults.map((username) => (
            <button
              key={username}
              type="button"
              onClick={() => handleUserSelect(username)}
              className="flex w-full items-center space-x-3 rounded-lg border border-[#3a424a] bg-[#262b30] p-3 text-left transition-colors hover:bg-[#2f353d]"
            >
              <img
                src={`https://images.hive.blog/u/${username}/avatar`}
                alt={username}
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    username
                  )}&background=random&color=fff&size=40`
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#f0f0f8]">@{username}</p>
              </div>
            </button>
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#3a424a] bg-[#111827]">
      <div className="sticky top-0 z-10 border-b border-[#3a424a] bg-[#212529]/95">
        <div className="flex items-center gap-2 px-4 py-3">
          <User className="h-5 w-5 text-[#e31337]" />
          <h2 className="text-sm font-semibold text-[#f9fafb] sm:text-base">Search users</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-[#212529]/95 p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#3a424a] bg-[#1a1e22] py-2 pl-10 pr-10 text-sm text-white placeholder-[#9ca3b0] outline-none focus:border-transparent focus:ring-2 focus:ring-[#e31337]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#212529]/95">{renderSearchState()}</div>
      </div>
    </div>
  )
}

