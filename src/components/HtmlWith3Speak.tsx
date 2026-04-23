/**
 * Renders HTML and replaces any a[href*="3speak.tv"] with the native 3Speak player.
 * Use wherever user content (markdown-rendered HTML) is displayed.
 */
import { useCallback, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { parseHiveFrontendUrl } from 'hive-react-kit'
import { parse3SpeakUrl, htmlEnsure3speakLinks } from '../utils/3speak'
import { ThreeSpeakPlayer } from './ThreeSpeakPlayer'
import { YoutubeInlineEmbed, parseYoutubeId } from './YoutubeInlineEmbed'

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
      if (!href) return

      // 1. Internal root-relative links emitted by our renderer (e.g. /@alice, /trending/x)
      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        navigate(href)
        return
      }

      // 2. External Hive-frontend URLs — peakd, hive.blog, ecency, inleo, and
      //    in-app hash hrefs (#/@alice[/permlink]). Route them to our own
      //    detail page / profile instead of opening externally.
      const target = parseHiveFrontendUrl(href)
      if (!target) return
      e.preventDefault()
      if (target.kind === 'post') {
        navigate(`/@${target.author}/${target.permlink}`)
      } else if (target.kind === 'user') {
        navigate(`/@${target.author}`)
      }
    },
    [navigate]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const roots: Array<{ root: ReturnType<typeof createRoot> }> = []

    // Replace 3Speak anchors with inline players.
    const threeSpeakLinks = container.querySelectorAll<HTMLAnchorElement>('a[href*="3speak.tv"]')
    threeSpeakLinks.forEach((link) => {
      const href = link.getAttribute('href')
      if (!href) return
      const parsed = parse3SpeakUrl(href)
      if (!parsed) return

      const wrapper = document.createElement('div')
      wrapper.className = 'speak-player-wrapper'
      link.parentNode?.replaceChild(wrapper, link)

      const root = createRoot(wrapper)
      root.render(<ThreeSpeakPlayer author={parsed.author} permlink={parsed.permlink} />)
      roots.push({ root })
    })

    // Replace any YouTube reference — whether the Hive renderer emitted it as
    // an anchor (`<a href="youtube…">`) OR auto-embedded it as an iframe
    // (`<iframe src="https://www.youtube.com/embed/…">`) — with our inline
    // thumbnail → youtube-nocookie iframe embed. On Android WebView, a bare
    // youtube.com iframe/anchor triggers the native YouTube intent and yanks
    // the user out of hsnaps; forcing our nocookie-based embed keeps
    // playback inside the app.
    const youtubeElements = container.querySelectorAll<HTMLElement>(
      'a[href*="youtube.com"], a[href*="youtu.be"], iframe[src*="youtube.com"], iframe[src*="youtu.be"]'
    )
    youtubeElements.forEach((el) => {
      const url =
        el.tagName === 'A'
          ? el.getAttribute('href')
          : el.getAttribute('src')
      if (!url) return
      const videoId = parseYoutubeId(url)
      if (!videoId) return

      const wrapper = document.createElement('div')
      wrapper.className = 'yt-inline-embed-wrapper'
      el.parentNode?.replaceChild(wrapper, el)

      const root = createRoot(wrapper)
      root.render(<YoutubeInlineEmbed videoId={videoId} />)
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
