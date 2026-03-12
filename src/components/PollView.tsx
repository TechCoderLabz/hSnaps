/**
 * PollView: Interactive poll renderer for post cards.
 * - Fetches live results from hivehub polls API
 * - Supports voting via aioha custom_json broadcast
 * - Checkboxes when max_choices_voted > 1, otherwise radio
 * - Highlights current user's vote
 * - Respects ui_hide_res_until_voted
 * - Green progress bars for results with % on each choice
 */
import { useAioha } from '@aioha/react-provider'
import { KeyTypes } from '@aioha/aioha'
import type { SignOperationResult } from '@aioha/aioha'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { fetchPollResults } from '../services/pollService'
import type { PollApiResponse } from '../services/pollService'
import { useAuthData } from '../stores/authStore'

export interface ParsedPollData {
  content_type: 'poll'
  version: number
  question: string
  choices: string[]
  preferred_interpretation: string
  end_time: number
  max_choices_voted: number
  allow_vote_changes: boolean
  filters: { account_age: number }
  ui_hide_res_until_voted: boolean
}

/** Try to extract poll data from json_metadata string. Returns null if not a poll. */
export function parsePollFromMetadata(jsonMetadata?: string): ParsedPollData | null {
  if (!jsonMetadata) return null
  try {
    const parsed = JSON.parse(jsonMetadata)
    if (parsed?.content_type === 'poll' && parsed?.question && Array.isArray(parsed?.choices)) {
      return parsed as ParsedPollData
    }
  } catch {
    // not valid JSON
  }
  return null
}

interface PollViewProps {
  poll: ParsedPollData
  author: string
  permlink: string
}

export function PollView({ poll, author, permlink }: PollViewProps) {
  const { aioha } = useAioha()
  const { isAuthenticated, username } = useAuthData()

  const [apiData, setApiData] = useState<PollApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChoices, setSelectedChoices] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  // Fetch poll results
  const loadResults = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true)
      fetchPollResults(author, permlink, signal).then((data) => {
        if (signal?.aborted) return
        setApiData(data)
        setLoading(false)
      })
    },
    [author, permlink],
  )

  useEffect(() => {
    const controller = new AbortController()
    loadResults(controller.signal)
    return () => controller.abort()
  }, [loadResults])

  // Detect current user's existing vote from API data
  useEffect(() => {
    if (!apiData?.poll_voters || !username) return
    const userLower = username.toLowerCase()
    const userVote = apiData.poll_voters.find(
      (v) => v.name?.toLowerCase() === userLower,
    )
    if (userVote) {
      setSelectedChoices(userVote.choices)
      setHasVoted(true)
    }
  }, [apiData?.poll_voters, username])

  const isExpired = useMemo(() => {
    if (apiData?.status === 'Finished') return true
    return Date.now() > poll.end_time * 1000
  }, [poll.end_time, apiData?.status])

  const endLabel = useMemo(() => {
    if (isExpired) return 'Poll ended'
    const d = new Date(poll.end_time * 1000)
    const now = Date.now()
    const diff = d.getTime() - now
    if (diff < 86400_000) {
      const hours = Math.floor(diff / 3600_000)
      return hours <= 1 ? 'Ends in less than an hour' : `Ends in ${hours}h`
    }
    const days = Math.ceil(diff / 86400_000)
    return `Ends in ${days} day${days > 1 ? 's' : ''}`
  }, [poll.end_time, isExpired])

  // Build vote counts from API data
  const choiceResults = useMemo(() => {
    const apiChoices = apiData?.poll_choices
    return poll.choices.map((text, idx) => {
      const choiceNum = idx + 1
      const apiChoice = apiChoices?.find(
        (c) => c.choice_num === choiceNum || c.choice_text === text,
      )
      const voteCount = apiChoice?.votes?.total_votes ?? 0
      return { text, voteCount, choiceNum }
    })
  }, [poll.choices, apiData?.poll_choices])

  const totalVotes = useMemo(
    () =>
      apiData?.poll_stats?.total_voting_accounts_num ??
      apiData?.poll_voters?.length ??
      choiceResults.reduce((sum, c) => sum + c.voteCount, 0),
    [apiData?.poll_stats, apiData?.poll_voters, choiceResults],
  )

  // Whether results should be visible
  const showResults = useMemo(() => {
    if (loading) return false
    if (poll.ui_hide_res_until_voted && !hasVoted) return false
    return true
  }, [loading, poll.ui_hide_res_until_voted, hasVoted])

  // Can the user vote?
  const canVote = useMemo(() => {
    if (!isAuthenticated) return false
    if (isExpired) return false
    if (hasVoted && !poll.allow_vote_changes) return false
    return true
  }, [isAuthenticated, isExpired, hasVoted, poll.allow_vote_changes])

  const isMultiChoice = poll.max_choices_voted > 1

  const toggleChoice = (choiceNum: number) => {
    if (!canVote) return
    setSelectedChoices((prev) => {
      if (isMultiChoice) {
        if (prev.includes(choiceNum)) {
          return prev.filter((c) => c !== choiceNum)
        }
        if (prev.length >= poll.max_choices_voted) return prev
        return [...prev, choiceNum]
      }
      // Single choice: toggle or replace
      return prev.includes(choiceNum) ? [] : [choiceNum]
    })
  }

  const handleVote = async () => {
    if (!aioha || !aioha.isLoggedIn()) {
      toast.error('Please login to vote')
      return
    }
    if (selectedChoices.length === 0) {
      toast.error('Please select at least one option')
      return
    }
    setSubmitting(true)
    try {
      const pollJson = {
        poll: `${author}/${permlink}`,
        action: 'vote',
        choices: selectedChoices,
      }
      const result: SignOperationResult = await aioha.customJSON(
        KeyTypes.Posting,
        'polls',
        pollJson,
        'Poll Vote',
      )
      if (result && typeof result === 'object' && result.success === true) {
        toast.success(hasVoted ? 'Vote updated' : 'Vote submitted')
        setHasVoted(true)
        // Refresh results after a short delay for the API to process
        setTimeout(() => loadResults(), 3000)
      } else {
        const errMsg = (result as { error?: string })?.error ?? 'Vote failed'
        throw new Error(errMsg)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Vote failed'
      const lower = msg.toLowerCase()
      if (lower.includes('cancel') || lower.includes('reject') || lower.includes('denied')) {
        toast.error('Vote cancelled')
      } else {
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2 mb-1 rounded-xl border border-[#3a424a] bg-[#1a1d21] overflow-hidden">
      <div className="px-3 py-2.5">
        {/* Question */}
        <div className="flex items-start gap-2 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-[#e31337] mt-0.5"
          >
            <rect x="3" y="3" width="4" height="18" rx="1" />
            <rect x="10" y="8" width="4" height="13" rx="1" />
            <rect x="17" y="5" width="4" height="16" rx="1" />
          </svg>
          <p className="text-sm font-medium text-[#f0f0f8] leading-snug">{poll.question}</p>
        </div>

        {/* Choices */}
        <div className="space-y-1.5">
          {choiceResults.map((choice) => {
            const isSelected = selectedChoices.includes(choice.choiceNum)
            const pct =
              showResults && totalVotes > 0
                ? Math.round((choice.voteCount / totalVotes) * 100)
                : 0

            return (
              <button
                key={choice.choiceNum}
                type="button"
                onClick={() => toggleChoice(choice.choiceNum)}
                disabled={!canVote || submitting}
                className={`relative w-full rounded-lg border text-left overflow-hidden transition-colors ${
                  isSelected
                    ? 'border-[#e31337]/60 bg-[#262b30]'
                    : 'border-[#3a424a] bg-[#262b30] hover:border-[#505863]'
                } ${!canVote && !isSelected ? 'cursor-default' : ''} disabled:opacity-80`}
              >
                {/* Green progress bar background */}
                {showResults && (
                  <div
                    className="absolute inset-y-0 left-0 bg-[#e31337]/15 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                )}

                {/* Choice content */}
                <div className="relative flex items-center gap-2.5 px-3 py-2">
                  {/* Checkbox / Radio indicator */}
                  {canVote && (
                    <span className="shrink-0">
                      {isMultiChoice ? (
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                            isSelected
                              ? 'border-[#e31337] bg-[#e31337] text-white'
                              : 'border-[#505863] bg-transparent'
                          }`}
                        >
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-[#e31337]'
                              : 'border-[#505863]'
                          }`}
                        >
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-[#e31337]" />
                          )}
                        </span>
                      )}
                    </span>
                  )}

                  {/* Choice text + percentage */}
                  <span className="flex-1 text-sm text-[#c8cad6]">
                    {choice.text}
                    {showResults && (
                      <span className="ml-1.5 text-xs font-medium text-[#9ca3b0]">
                        {pct}%
                      </span>
                    )}
                  </span>

                  {/* Vote count */}
                  {showResults && (
                    <span className="shrink-0 text-xs text-[#9ca3b0]">
                      {choice.voteCount}
                    </span>
                  )}

                  {/* User's vote indicator (when not in canVote mode) */}
                  {!canVote && isSelected && (
                    <span className="shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e31337" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Vote button */}
        {canVote && selectedChoices.length > 0 && (
          <button
            type="button"
            onClick={() => void handleVote()}
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-[#e31337] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#c51231] disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : hasVoted ? 'Update Vote' : 'Vote'}
          </button>
        )}

        {/* Footer meta */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#9ca3b0]">
          <span className={isExpired ? 'text-red-400' : ''}>{endLabel}</span>
          <span>&middot;</span>
          {showResults && totalVotes > 0 ? (
            <span>
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </span>
          ) : loading ? (
            <span>Loading...</span>
          ) : poll.ui_hide_res_until_voted && !hasVoted ? (
            <span>Vote to see results</span>
          ) : (
            <span>No votes yet</span>
          )}
          <span>&middot;</span>
          <span>
            {isMultiChoice
              ? `Select up to ${poll.max_choices_voted} choices`
              : 'Select one choice'}
          </span>
          {poll.allow_vote_changes && (
            <>
              <span>&middot;</span>
              <span>Vote changes allowed</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
