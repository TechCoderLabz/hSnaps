/**
 * Hook: create a Hive Markdown renderer instance (DefaultRenderer from @hiveio/content-renderer).
 * Renders on every call; use for live preview.
 */
import { useMemo } from 'react'
import { DefaultRenderer } from '@hiveio/content-renderer'
import { proxyImageUrl } from '../utils/imageProxy'

const RENDERER_OPTIONS = {
  baseUrl: 'https://hive.blog/',
  breaks: true,
  skipSanitization: false,
  allowInsecureScriptTags: false,
  addNofollowToLinks: true,
  doNotShowImages: false,
  assetsWidth: 640,
  assetsHeight: 480,
  imageProxyFn: (url: string) =>
    typeof url === 'string' && url.length > 0 ? proxyImageUrl(url, 640) : '',
  usertagUrlFn: (account: string) => `/@${account}`,
  hashtagUrlFn: (hashtag: string) => `/trending/${hashtag}`,
  isLinkSafeFn: () => true,
  addExternalCssClassToMatchingLinksFn: () => true,
  ipfsPrefix: 'https://ipfs.io/ipfs/',
}

export function useMarkdownRenderer() {
  const renderer = useMemo(() => {
    const Renderer = DefaultRenderer
    return new Renderer(RENDERER_OPTIONS as ConstructorParameters<typeof DefaultRenderer>[0])
  }, [])
  return (markdown: string) => renderer.render(markdown ?? '')
}
