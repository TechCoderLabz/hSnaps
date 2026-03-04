import { useEffect, useState } from 'react'
import { Send, X } from 'lucide-react'
import { AddCommentInput } from './AddCommentInput'

interface ReplyModalProps {
  parentAuthor: string
  parentPermlink: string
  onClose: () => void
  onCommentSubmitted: (parentAuthor: string, parentPermlink: string, body: string) => Promise<void>
  currentUser?: string
}

export function ReplyModal({
  parentAuthor,
  parentPermlink,
  onClose,
  onCommentSubmitted,
  currentUser,
}: ReplyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (body: string) => {
    if (!body.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onCommentSubmitted(parentAuthor, parentPermlink, body)
      onClose()
    } catch (error) {
      console.error('Failed to submit reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#3a424a] bg-[#262b30] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3a424a] bg-[#20262c] p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-[#e31337]/10 p-2">
              <Send className="h-5 w-5 text-[#e31337]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-50">Reply to Comment</h2>
              <p className="text-sm text-zinc-400">@{parentAuthor}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 transition-colors duration-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            <X className="h-6 w-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AddCommentInput
            onSubmit={handleSubmit}
            onCancel={onClose}
            currentUser={currentUser}
            parentAuthor={parentAuthor}
            parentPermlink={parentPermlink}
            placeholder={`Reply to @${parentAuthor}...`}
          />
        </div>

        <div className="border-t border-[#3a424a] bg-[#20262c] p-4 md:p-6">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center space-x-4">
              <span>• Markdown supported</span>
              <span>• Be respectful</span>
            </div>
            <div className="hidden md:block">Press Esc to close</div>
          </div>
        </div>
      </div>
    </div>
  )
}

