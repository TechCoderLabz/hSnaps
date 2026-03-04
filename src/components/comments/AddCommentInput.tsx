import { useEffect, useRef, useState } from 'react'
import { Send, User } from 'lucide-react'

interface AddCommentInputProps {
  onSubmit: (body: string) => void | Promise<void>
  onCancel: () => void
  currentUser?: string
  placeholder?: string
  parentAuthor?: string
  parentPermlink?: string
}

export function AddCommentInput({
  onSubmit,
  onCancel,
  currentUser,
  placeholder = 'Write your comment...',
  parentAuthor,
}: AddCommentInputProps) {
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSubmit = async () => {
    if (!body.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(body.trim())
      setBody('')
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void handleSubmit()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="space-y-4 bg-[#262b30] p-4 md:p-6">
      <div className="flex items-center justify-start space-x-3 text-left">
        <div className="flex-shrink-0">
          {currentUser ? (
            <img
              src={`https://images.hive.blog/u/${currentUser}/avatar`}
              alt={currentUser}
              className="h-10 w-10 rounded-full border-2 border-zinc-600 object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentUser}&background=random`
              }}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
              <User className="h-6 w-6 text-zinc-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-sm font-medium text-zinc-50">
            {currentUser ? `@${currentUser}` : 'Anonymous'}
          </div>
          {parentAuthor && (
            <div className="text-xs text-zinc-400">Replying to @{parentAuthor}</div>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="max-h-[300px] min-h-[100px] w-full resize-none rounded-lg border border-zinc-700 bg-[#1c2127] p-4 text-sm text-zinc-50 placeholder-zinc-500 outline-none transition-colors duration-200 focus:border-[#e31337] focus:ring-2 focus:ring-[#e31337]/40 disabled:opacity-50"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = `${target.scrollHeight}px`
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">Press Cmd+Enter to post</div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-zinc-400 transition-colors duration-200 hover:text-zinc-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !body.trim()}
            className="inline-flex items-center space-x-2 rounded-lg bg-[#e31337] px-6 py-2 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-[#c81131] hover:scale-[1.02] disabled:scale-100 disabled:bg-zinc-600 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

