/**
 * Renders HTML and replaces any a[href*="3speak.tv"] with the native 3Speak player.
 * Use wherever user content (markdown-rendered HTML) is displayed.
 */
import { useCallback, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { parse3SpeakUrl, htmlEnsure3speakLinks } from '../utils/3speak'
import { ThreeSpeakPlayer } from './ThreeSpeakPlayer'

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

interface HtmlWith3SpeakProps {
  html: string
  className?: string
}

export function HtmlWith3Speak({ html, className = '' }: HtmlWith3SpeakProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRootsRef = useRef<Array<{ root: ReturnType<typeof createRoot> }>>([])
  const navigate = useNavigate()
  const htmlWithLinks = DOMPurify.sanitize(htmlEnsure3speakLinks(html), {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allowfullscreen', 'frameborder', 'scrolling', 'allow', 'loading'],
    FORBID_TAGS: ['script', 'style', 'svg', 'math'],
    ALLOW_DATA_ATTR: false,
  })

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return
      e.preventDefault()
      navigate(href)
    },
    [navigate]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const links = container.querySelectorAll<HTMLAnchorElement>('a[href*="3speak.tv"]')
    const roots: Array<{ root: ReturnType<typeof createRoot> }> = []

    links.forEach((link) => {
      const href = link.getAttribute('href')
      if (!href) return
      const parsed = parse3SpeakUrl(href)
      if (!parsed) return

      const wrapper = document.createElement('div')
      wrapper.className = 'speak-player-wrapper'
      link.parentNode?.replaceChild(wrapper, link)

      const root = createRoot(wrapper)
      root.render(
        <ThreeSpeakPlayer author={parsed.author} permlink={parsed.permlink} />
      )
      roots.push({ root })
    })

    mountedRootsRef.current = roots

    return () => {
      roots.forEach(({ root }) => root.unmount())
      mountedRootsRef.current = []
    }
  }, [htmlWithLinks])

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: htmlWithLinks }}
      className={className}
    />
  )
}
