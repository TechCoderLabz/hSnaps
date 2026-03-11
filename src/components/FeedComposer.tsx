/**
 * Feed post composer: markdown body, toolbar (Bold, Italic, Link,
 * Image upload, Mention, Emoji, Giphy), live preview. View/preview uses Hive renderer only.
 * Renders nothing when user is not logged in.
 */
import React, { useRef, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import { useHiveOperations } from '../hooks/useHiveOperations'
import { parseBodyFromMarkdown } from '../utils/postBody'
import { ParsedBodyContent } from './FeedItemBody'
import GiphyPicker from './GiphyPicker'
import ImageUploader from './ImageUploader'
import type { FeedType } from '../utils/types'
import { FEED_CHAR_LIMITS } from '../utils/types'

interface FeedComposerProps {
  feedType: FeedType
  /** When provided with selectedFeed, post to a single feed (one comment). */
  containerRefs?: Partial<Record<FeedType, { author: string; permlink: string }>>
  selectedFeed?: FeedType
  parentAuthor?: string
  parentPermlink?: string
  onSuccess?: () => void
  placeholder?: string
  authorMention?: string
  /** When true, use comment metadata (no tags, hsnaps app) and 2000 char limit. */
  replyMode?: boolean
}

/** Extract image URLs from markdown ![](url) or ![alt](url) */
function extractImageUrlsFromMarkdown(md: string): string[] {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  const urls: string[] = []
  let m
  while ((m = re.exec(md)) !== null) urls.push(m[2].trim())
  return [...new Set(urls)]
}

const DEVELOPER = 'sagarkothari88'

/** Build app-specific json_metadata for each feed type. Compulsory fields per feed; rest optional. */
function buildJsonMetadataForFeed(feedType: FeedType, body: string): string {
  const images = extractImageUrlsFromMarkdown(body)
  const now = new Date()
  const wavesTag = `waves-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  switch (feedType) {
    case 'snaps':
      return JSON.stringify({
        app: 'hivesnaps/1.0',
        developer: DEVELOPER,
        tags: ['hive-178315', 'snaps'],
        ...(images.length > 0 && { image: images }),
      })
    case 'waves':
      return JSON.stringify({
        app: 'ecency/3.5.1-mobile',
        developer: DEVELOPER,
        tags: [wavesTag],
        type: 'wave',
        ...(images.length > 0 && { image: images }),
        ...(images.length > 0 && { image_ratios: images.map(() => 1.17) }),
        format: 'markdown+html',
        links: [],
      })
    case 'threads':
      return JSON.stringify({
        app: 'leothreads/0.3',
        developer: DEVELOPER,
        isPoll: false,
        pollOptions: {},
        tags: ['leofinance'],
        dimensions: {},
        format: 'markdown',
      })
    case 'moments':
      return JSON.stringify({
        app: 'peakd/2026.3.1',
        developer: DEVELOPER,
        image: images.length > 0 ? images : [],
        tags: ['moments'],
      })
    default:
      return JSON.stringify({
        app: 'hivesnaps/1.0',
        developer: DEVELOPER,
        tags: ['hive-178315', 'snaps'],
        format: 'markdown',
      })
  }
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
  containerRefs,
  selectedFeed,
  parentAuthor,
  parentPermlink,
  onSuccess,
  placeholder = 'Write in Markdown...',
  replyMode = false,
}: FeedComposerProps) {
  const { isAuthenticated } = useAuthData()
  const { comment } = useHiveOperations()
  if (!isAuthenticated) return null

  const composeSingleFeedMode = Boolean(containerRefs && selectedFeed)
  const effectiveFeed = composeSingleFeedMode ? selectedFeed! : feedType
  const limit = replyMode
    ? REPLY_CHAR_LIMIT
    : FEED_CHAR_LIMITS[effectiveFeed]
  const containerRef = composeSingleFeedMode ? containerRefs?.[effectiveFeed] : null
  const hasActiveFeed = !composeSingleFeedMode || Boolean(containerRef)
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

  const imagesInBody = extractImageUrlsFromMarkdown(body)
  const momentsSelectedNoImage = Boolean(composeSingleFeedMode && effectiveFeed === 'moments' && imagesInBody.length === 0)
  const parsedPreview = useMemo(() => parseBodyFromMarkdown(body), [body])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (body.length > limit || isSubmitting) return
    if (composeSingleFeedMode && effectiveFeed === 'moments' && imagesInBody.length === 0) {
      toast.error('Moments requires at least one image. Please upload or add an image to your post.')
      return
    }
    setIsSubmitting(true)
    try {
      if (composeSingleFeedMode && containerRef) {
        const jsonMetadata = buildJsonMetadataForFeed(effectiveFeed, body.trim())
        await comment(containerRef.author, containerRef.permlink, body.trim(), '', jsonMetadata)
        toast.success('Posted successfully!')
      } else {
        const meta = replyMode
          ? { tags: [] as string[], app: 'hsnaps/1.0.0' }
          : { tags: feedType === 'snaps' ? ['hive-178315', 'snaps'] : feedType === 'threads' ? ['leofinance'] : feedType === 'waves' ? ['ecency'] : ['liketu'], app: feedType === 'snaps' ? 'hivesnaps/1.0' : feedType === 'threads' ? 'leothreads/0.3' : feedType === 'waves' ? 'ecency/3.5.1-mobile' : 'peakd/2026.3.1' }
        const jsonMetadata = replyMode
          ? JSON.stringify({ tags: meta.tags, app: meta.app, format: 'markdown' })
          : buildJsonMetadataForFeed(feedType, body.trim())
        await comment(parentAuthor!, parentPermlink!, body.trim(), '', jsonMetadata)
        toast.success('Posted successfully!')
      }
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
            placeholder={placeholder}
            disabled={isSubmitting}
            rows={4}
            className={`w-full resize-y rounded-lg border bg-[#2f353d] px-3 py-2.5 text-[#f0f0f8] placeholder-[#9ca3b0] focus:border-[#e31337] focus:outline-none text-sm ${
              over ? 'border-red-500/50' : 'border-[#3a424a]'
            }`}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs ${over ? 'text-red-400' : 'text-[#9ca3b0]'}`}>
                {body.length} / {limit}
              </span>
              {momentsSelectedNoImage && (
                <span className="text-xs text-amber-400">Moments requires at least one image</span>
              )}
            </div>
            <button
              type="submit"
              disabled={over || isSubmitting || !body.trim() || !hasActiveFeed || momentsSelectedNoImage}
              className="rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[#c51231]"
              title={momentsSelectedNoImage ? 'Moments requires at least one image' : undefined}
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
