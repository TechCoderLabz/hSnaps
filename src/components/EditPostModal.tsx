/**
 * Modal for editing an existing post. Pre-fills body with existing content.
 * On submit, broadcasts a comment with the same permlink to update the post on-chain.
 */
import React, { useState, useRef, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useHiveOperations, stripAppSuffix } from '../hooks/useHiveOperations'
import { parseBodyFromMarkdown } from '../utils/postBody'
import { ParsedBodyContent } from './FeedItemBody'
import ImageUploader from './ImageUploader'
import GiphyPicker from './GiphyPicker'
import type { NormalizedPost } from '../utils/types'

interface EditPostModalProps {
  post: NormalizedPost
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newBody: string) => void
}

/** Extract image URLs from markdown ![](url) or ![alt](url) */
function extractImageUrlsFromMarkdown(md: string): string[] {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  const urls: string[] = []
  let m
  while ((m = re.exec(md)) !== null) urls.push(m[2].trim())
  return [...new Set(urls)]
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️',
]

export function EditPostModal({ post, isOpen, onClose, onSuccess }: EditPostModalProps) {
  const { editPost } = useHiveOperations()
  const [body, setBody] = useState(() => stripAppSuffix(post.body))
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGiphyOpen, setIsGiphyOpen] = useState(false)
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const parsedPreview = useMemo(() => parseBodyFromMarkdown(body), [body])

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
    if (!body.trim() || isSubmitting) return

    const parentAuthor = post.parent_author
    const parentPermlink = post.parent_permlink
    if (!parentAuthor || !parentPermlink) {
      toast.error('Cannot edit: missing parent post info')
      return
    }

    setIsSubmitting(true)
    try {
      const finalBody = body.trim()
      const images = extractImageUrlsFromMarkdown(finalBody)
      const existingMeta = post.json_metadata ? JSON.parse(post.json_metadata) : {}
      if (images.length > 0) {
        existingMeta.image = images
      }
      const jsonMetadata = JSON.stringify(existingMeta)

      await editPost(parentAuthor, parentPermlink, post.permlink, finalBody, post.title, jsonMetadata)
      toast.success('Post updated successfully!')
      onSuccess?.(finalBody)
      onClose()
    } catch {
      // error toast already shown by useHiveOperations
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#3a424a] border-b-0 bg-[#262b30] sm:rounded-2xl sm:border-b">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3 bg-[#262b30] border-b border-[#3a424a]">
          <h2 className="text-base font-semibold text-[#f0f0f8]">Edit post</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3b0] transition-colors hover:bg-[#2f353d] hover:text-[#f0f0f8]"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <button type="button" onClick={() => setShowPreview((v) => !v)} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] text-sm" title={showPreview ? 'Hide preview' : 'Preview'}>
              {showPreview ? '👁‍🗨' : '👁'}
            </button>
            <button type="button" onClick={() => insertAtCursor('**', '**')} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] font-bold text-sm" title="Bold">B</button>
            <button type="button" onClick={() => insertAtCursor('*', '*')} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] italic text-sm" title="Italic">I</button>
            <button type="button" onClick={() => insertAtCursor('[', '](url)')} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] text-sm" title="Link">🔗</button>
            <ImageUploader onImageUploaded={insertImage} disabled={isSubmitting} />
            <button type="button" onClick={() => setIsEmojiOpen(true)} className="p-2 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] text-sm" title="Emoji">😀</button>
            <button type="button" onClick={() => setIsGiphyOpen(true)} className="px-2 py-1.5 rounded-lg hover:bg-[#2f353d] text-[#c8cad6] text-xs font-semibold" title="GIF">GIF</button>
          </div>

          {showPreview && body.trim() && (
            <div className="mb-3 rounded-xl border border-[#3a424a] bg-[#2f353d] overflow-hidden">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-[#9ca3b0] bg-[#272d34]">Preview</div>
              <div className="px-3 py-2 text-sm text-zinc-300 [&_a]:text-[#e31337] [&_a]:underline [&_a]:break-all">
                <ParsedBodyContent parsed={parsedPreview} imageLayout="grid" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Edit your post..."
              disabled={isSubmitting}
              rows={6}
              className="w-full resize-y rounded-lg border border-[#3a424a] bg-[#2f353d] px-3 py-2.5 text-[#f0f0f8] placeholder-[#9ca3b0] focus:border-[#e31337] focus:outline-none text-sm"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-[#9ca3b0]">{body.length} chars</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-[#3a424a] bg-[#262b30] px-4 py-2 text-sm font-medium text-[#f0f0f8] transition-colors hover:bg-[#2f353d] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !body.trim()}
                  className="rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[#c51231]"
                >
                  {isSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <GiphyPicker isOpen={isGiphyOpen} onClose={() => setIsGiphyOpen(false)} onSelectGif={insertGif} />

      {isEmojiOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsEmojiOpen(false)} aria-hidden />
          <div className="relative bg-[#262b30] border border-[#3a424a] rounded-xl shadow-xl p-4 max-w-sm w-full max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#f0f0f8]">Choose an emoji</h3>
              <button type="button" onClick={() => setIsEmojiOpen(false)} className="p-1.5 hover:bg-[#2f353d] rounded text-[#c8cad6] text-xl">×</button>
            </div>
            <div className="grid grid-cols-8 gap-1.5 max-h-60 overflow-y-auto">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="p-2 hover:bg-[#2f353d] rounded text-lg transition-colors">
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
