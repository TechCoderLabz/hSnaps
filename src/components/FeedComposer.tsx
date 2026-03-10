/**
 * Feed post composer: markdown body, toolbar (Bold, Italic, Link,
 * Image upload, Mention, Emoji, Giphy), live preview. View/preview uses Hive renderer only.
 * Renders nothing when user is not logged in.
 */
import React, { useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer'
import { useHiveOperations } from '../hooks/useHiveOperations'
import GiphyPicker from './GiphyPicker'
import ImageUploader from './ImageUploader'
import type { FeedType } from '../utils/types'
import { FEED_CHAR_LIMITS } from '../utils/types'

interface FeedComposerProps {
  feedType: FeedType
  parentAuthor: string
  parentPermlink: string
  onSuccess?: () => void
  placeholder?: string
  authorMention?: string
  /** When true, use comment metadata (no tags, hsnaps app) and 2000 char limit. */
  replyMode?: boolean
}

const FEED_METADATA: Record<FeedType, { tags: string[]; app: string }> = {
  snaps:   { tags: ['snaps'],                  app: 'peakd/2026.2.6'     },
  threads: { tags: ['leofinance'],             app: 'leothreads/1.0.0'   },
  waves:   { tags: ['ecency'],                 app: 'ecency/3.0.0'       },
  moments:  { tags: ['liketu'],                 app: 'liketu/1.0.0'       },
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
  '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️',
  '🖖', '👋', '🤝', '👏', '🙌', '👐', '🤲', '🤜', '🤛', '✊', '👊',
]

const REPLY_CHAR_LIMIT = 2000

export function FeedComposer({
  feedType,
  parentAuthor,
  parentPermlink,
  onSuccess,
  placeholder = 'Write in Markdown...',
  replyMode = false,
}: FeedComposerProps) {
  const { isAuthenticated } = useAuthData()
  const renderHive = useMarkdownRenderer()
  const { comment } = useHiveOperations()
  if (!isAuthenticated) return null

  const limit = replyMode ? REPLY_CHAR_LIMIT : FEED_CHAR_LIMITS[feedType]
  const [body, setBody] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isGiphyOpen, setIsGiphyOpen] = useState(false)
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = useCallback(
    (before: string, after = '') => {
      const el = textareaRef.current
      if (!el) return
      const start = el.selectionStart
      const end = el.selectionEnd
      const selected = body.slice(start, end)
      const newBody = body.slice(0, start) + before + selected + after + body.slice(end)
      setBody(newBody)
      setTimeout(() => {
        el.focus()
        el.setSelectionRange(start + before.length, start + before.length + selected.length)
      }, 0)
    },
    [body]
  )

  const insertLink = () => insertAtCursor('[', '](url)')
  const insertBold = () => insertAtCursor('**', '**')
  const insertItalic = () => insertAtCursor('*', '*')

  const insertImage = (url: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const markdown = `![Image](${url})`
    setBody(body.slice(0, start) + markdown + body.slice(start))
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + markdown.length, start + markdown.length)
    }, 0)
  }

  const insertGif = (gifUrl: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const markdown = `![GIF](${gifUrl})`
    setBody(body.slice(0, start) + markdown + body.slice(start))
    setIsGiphyOpen(false)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + markdown.length, start + markdown.length)
    }, 0)
  }

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    setBody(body.slice(0, start) + emoji + body.slice(start))
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
    setIsEmojiOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (body.length > limit || isSubmitting) return
    setIsSubmitting(true)
    try {
      const meta = replyMode
        ? { tags: [] as string[], app: 'hsnaps/1.0.0' }
        : FEED_METADATA[feedType]
      const jsonMetadata = JSON.stringify({ tags: meta.tags, app: meta.app, format: 'markdown' })
      await comment(parentAuthor, parentPermlink, body.trim(), '', jsonMetadata)
      toast.success('Posted successfully!')
      setBody('')
      onSuccess?.()
    } catch {
      // error toast already shown by useHiveOperations
    } finally {
      setIsSubmitting(false)
    }
  }

  const over = body.length > limit

  return (
    <div className="rounded-2xl border border-[#3a424a] bg-[#262b30] shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] hover:text-[#f0f0f8] transition-colors"
            title={showPreview ? 'Hide preview' : 'Preview'}
          >
            {showPreview ? (
              <span className="text-sm">👁‍🗨</span>
            ) : (
              <span className="text-sm">👁</span>
            )}
          </button>
          <button type="button" onClick={insertBold} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6]" title="Bold">
            <span className="font-bold text-sm">B</span>
          </button>
          <button type="button" onClick={insertItalic} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] italic text-sm" title="Italic">
            I
          </button>
          <button type="button" onClick={insertLink} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] text-sm" title="Link">
            🔗
          </button>
          <ImageUploader onImageUploaded={insertImage} disabled={isSubmitting} />
          <button type="button" onClick={() => setIsEmojiOpen(true)} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] text-sm" title="Emoji">
            😀
          </button>
          <button type="button" onClick={() => setIsGiphyOpen(true)} className="px-2 py-1.5 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] text-xs font-semibold" title="GIF">
            GIF
          </button>
        </div>

        {showPreview && body.trim() && (
          <div className="mb-3 rounded-xl border border-[#3a424a] bg-[#2f353d] overflow-hidden">
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-[#9ca3b0] bg-[#272d34]">Preview</div>
            <div
              className="px-3 m-2 py-2 prose prose-invert prose-zinc max-w-none !p-0 !border-0 !bg-transparent text-sm markdown-preview break-words [&_img]:max-w-full [&_a]:text-[#e31337] [&_a]:underline"
              // eslint-disable-next-line react/no-danger -- View only: Hive renderer output (@hiveio/content-renderer)
              dangerouslySetInnerHTML={{ __html: renderHive(body) }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            disabled={isSubmitting}
            rows={4}
            className={`w-full resize-y rounded-lg border bg-[#2f353d] px-3 py-2.5 text-[#f0f0f8] placeholder-[#9ca3b0] focus:border-[#e31337] focus:outline-none text-sm ${
              over ? 'border-red-500/50' : 'border-[#3a424a]'
            }`}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs ${over ? 'text-red-400' : 'text-[#9ca3b0]'}`}>
              {body.length} / {limit}
            </span>
            <button
              type="submit"
              disabled={over || isSubmitting || !body.trim()}
              className="rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[#c51231]"
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      <GiphyPicker isOpen={isGiphyOpen} onClose={() => setIsGiphyOpen(false)} onSelectGif={insertGif} />

      {isEmojiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsEmojiOpen(false)} aria-hidden />
          <div className="relative bg-[#262b30] border border-[#3a424a] rounded-xl shadow-xl p-4 max-w-sm w-full max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#f0f0f8]">Choose an emoji</h3>
              <button type="button" onClick={() => setIsEmojiOpen(false)} className="p-1.5 hover:bg-[#2f353d] rounded text-[#c8cad6] text-xl">
                ×
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1.5 max-h-60 overflow-y-auto">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="p-2 hover:bg-[#2f353d] rounded text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
