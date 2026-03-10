/**
 * Live Markdown preview using @hiveio/content-renderer.
 * 3speak.tv links are replaced with the native 3Speak player.
 */
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer'
import { HtmlWith3Speak } from './HtmlWith3Speak'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const render = useMarkdownRenderer()
  const html = render(content)

  return (
    <div
      className={`prose prose-invert prose-zinc max-w-none rounded-xl border border-zinc-700 bg-zinc-900/50 p-4 text-sm ${className}`}
    >
      <HtmlWith3Speak
        html={html}
        className="markdown-preview overflow-hidden break-words [&_img]:max-w-full [&_a]:text-[#e31337] [&_a]:underline"
      />
    </div>
  )
}
