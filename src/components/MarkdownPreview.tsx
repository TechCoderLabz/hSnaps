/**
 * Live Markdown preview using @hiveio/content-renderer.
 * Updates on every keystroke; accurate Hive Markdown + media.
 */
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer'

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
      <div
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
        className="markdown-preview overflow-hidden break-words [&_img]:max-w-full [&_a]:text-amber-400 [&_a]:underline"
      />
    </div>
  )
}
