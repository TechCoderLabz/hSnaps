/**
 * PollCreator: Modal for creating a poll to attach to a snap/post.
 * Collects question, choices, end date, max votes, vote-change policy,
 * account-age filter, and hide-results-until-voted toggle.
 */
import React, { useState } from 'react'

export interface PollData {
  question: string
  choices: string[]
  end_time: number
  max_choices_voted: number
  allow_vote_changes: boolean
  filters: { account_age: number }
  ui_hide_res_until_voted: boolean
}

interface PollCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (poll: PollData) => void
  initialData?: PollData | null
}

const MIN_CHOICES = 2
const MAX_CHOICES = 10

function defaultEndDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 16)
}

export default function PollCreator({ isOpen, onClose, onSave, initialData }: PollCreatorProps) {
  const [question, setQuestion] = useState(initialData?.question ?? '')
  const [choices, setChoices] = useState<string[]>(
    initialData?.choices?.length ? initialData.choices : ['', '']
  )
  const [endDate, setEndDate] = useState(
    initialData?.end_time
      ? new Date(initialData.end_time * 1000).toISOString().slice(0, 16)
      : defaultEndDate()
  )
  const [maxChoicesVoted, setMaxChoicesVoted] = useState(initialData?.max_choices_voted ?? 1)
  const [allowVoteChanges, setAllowVoteChanges] = useState(initialData?.allow_vote_changes ?? true)
  const [accountAge, setAccountAge] = useState(initialData?.filters?.account_age ?? 0)
  const [hideResultsUntilVoted, setHideResultsUntilVoted] = useState(
    initialData?.ui_hide_res_until_voted ?? false
  )

  if (!isOpen) return null

  const addChoice = () => {
    if (choices.length < MAX_CHOICES) setChoices([...choices, ''])
  }

  const removeChoice = (idx: number) => {
    if (choices.length > MIN_CHOICES) setChoices(choices.filter((_, i) => i !== idx))
  }

  const updateChoice = (idx: number, value: string) => {
    setChoices(choices.map((c, i) => (i === idx ? value : c)))
  }

  const filledChoices = choices.filter((c) => c.trim())
  const isValid =
    question.trim().length > 0 &&
    filledChoices.length >= MIN_CHOICES &&
    new Date(endDate).getTime() > Date.now()

  const handleSave = () => {
    if (!isValid) return
    onSave({
      question: question.trim(),
      choices: filledChoices,
      end_time: Math.floor(new Date(endDate).getTime() / 1000),
      max_choices_voted: Math.min(maxChoicesVoted, filledChoices.length),
      allow_vote_changes: allowVoteChanges,
      filters: { account_age: accountAge },
      ui_hide_res_until_voted: hideResultsUntilVoted,
    })
    onClose()
  }

  const inputClass =
    'w-full rounded-lg border border-[#3a424a] bg-[#2f353d] px-3 py-2 text-sm text-[#f0f0f8] placeholder-[#9ca3b0] focus:border-[#e31337] focus:outline-none'
  const labelClass = 'block text-xs font-medium text-[#c8cad6] mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-[#262b30] border border-[#3a424a] rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3a424a]">
          <h3 className="text-sm font-semibold text-[#f0f0f8]">Create Poll</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[#2f353d] rounded text-[#c8cad6] text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Question */}
          <div>
            <label className={labelClass}>Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className={inputClass}
              maxLength={256}
            />
          </div>

          {/* Choices */}
          <div>
            <label className={labelClass}>Choices (min {MIN_CHOICES}, max {MAX_CHOICES})</label>
            <div className="space-y-2">
              {choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => updateChoice(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className={inputClass}
                    maxLength={128}
                  />
                  {choices.length > MIN_CHOICES && (
                    <button
                      type="button"
                      onClick={() => removeChoice(idx)}
                      className="shrink-0 rounded p-1.5 text-[#9ca3b0] hover:bg-[#3a424a] hover:text-red-400"
                      title="Remove option"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {choices.length < MAX_CHOICES && (
              <button
                type="button"
                onClick={addChoice}
                className="mt-2 text-xs text-[#e31337] hover:text-[#ff4d6a] font-medium"
              >
                + Add option
              </button>
            )}
          </div>

          {/* End date */}
          <div>
            <label className={labelClass}>Poll ends at</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Max choices voted */}
          <div>
            <label className={labelClass}>
              Max choices a voter can select ({maxChoicesVoted})
            </label>
            <input
              type="range"
              min={1}
              max={Math.max(filledChoices.length, 1)}
              value={maxChoicesVoted}
              onChange={(e) => setMaxChoicesVoted(Number(e.target.value))}
              className="w-full accent-[#e31337]"
            />
          </div>

          {/* Allow vote changes */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowVoteChanges}
              onChange={(e) => setAllowVoteChanges(e.target.checked)}
              className="accent-[#e31337]"
            />
            <span className="text-xs text-[#c8cad6]">Allow voters to change their vote</span>
          </label>

          {/* Account age filter */}
          <div>
            <label className={labelClass}>
              Minimum account age to vote (days): {accountAge}
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={accountAge}
              onChange={(e) => setAccountAge(Math.max(0, Number(e.target.value)))}
              className={inputClass}
            />
          </div>

          {/* Hide results until voted */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideResultsUntilVoted}
              onChange={(e) => setHideResultsUntilVoted(e.target.checked)}
              className="accent-[#e31337]"
            />
            <span className="text-xs text-[#c8cad6]">Hide results until user has voted</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#3a424a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-[#c8cad6] hover:bg-[#2f353d]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[#c51231]"
          >
            Attach Poll
          </button>
        </div>
      </div>
    </div>
  )
}
