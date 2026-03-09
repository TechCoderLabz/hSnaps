/**
 * Renders HTML and replaces any a[href*="3speak.tv"] with the native 3Speak player.
 * Use wherever user content (markdown-rendered HTML) is displayed.
 */
import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { parse3SpeakUrl, htmlEnsure3speakLinks } from '../utils/3speak'
import { ThreeSpeakPlayer } from './ThreeSpeakPlayer'

interface HtmlWith3SpeakProps {
  html: string
  className?: string
}

export function HtmlWith3Speak({ html, className = '' }: HtmlWith3SpeakProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRootsRef = useRef<Array<{ root: ReturnType<typeof createRoot> }>>([])
  const htmlWithLinks = htmlEnsure3speakLinks(html)

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
      wrapper.className = '3speak-player-wrapper'
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
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: htmlWithLinks }}
      className={className}
    />
  )
}
