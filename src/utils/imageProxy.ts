/**
 * Hive image proxy utilities.
 * ALL external images must go through images.hive.blog to prevent IP leakage.
 */
const HIVE_IMAGE_PROXY_BASE = 'https://images.hive.blog'

const ALREADY_PROXIED_HOSTS = [
  'images.hive.blog',
]

function isAlreadyProxied(url: string): boolean {
  try {
    const u = new URL(url)
    return ALREADY_PROXIED_HOSTS.some((h) => u.hostname === h)
  } catch {
    return false
  }
}

function isDataOrBlob(url: string): boolean {
  return url.startsWith('data:') || url.startsWith('blob:')
}

function isGif(url: string): boolean {
  const q = url.indexOf('?')
  const path = (q === -1 ? url : url.slice(0, q)).toLowerCase()
  return path.endsWith('.gif')
}

/**
 * Proxy any external image URL through images.hive.blog.
 * Returns the URL unchanged if it's already proxied, a data/blob URL, or empty.
 * GIFs always use the 0x0 (no-resize) path so animation is preserved — the
 * proxy strips animation frames when resizing.
 */
export function proxyImageUrl(url: string, maxWidth = 0): string {
  if (!url || typeof url !== 'string') return url
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (isDataOrBlob(trimmed)) return trimmed
  if (isAlreadyProxied(trimmed)) return trimmed
  const size = maxWidth > 0 && !isGif(trimmed) ? `${maxWidth}x0` : '0x0'
  return `${HIVE_IMAGE_PROXY_BASE}/${size}/${trimmed}`
}

/**
 * Returns a Hive image proxy URL for thumbnail display (e.g. max 350px width).
 */
export function getHiveProxyThumbnailUrl(url: string, maxWidth = 350): string {
  return proxyImageUrl(url, maxWidth)
}
