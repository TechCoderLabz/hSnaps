/**
 * Hive image proxy for bandwidth-friendly thumbnails in feed.
 * Use 250x0 (max 250px width) for carousel/feed; use original URL for full-size lightbox.
 */
const HIVE_IMAGE_PROXY_BASE = 'https://images.hive.blog'

/**
 * Returns a Hive image proxy URL for thumbnail display (e.g. max 250px width).
 * Use this for feed item carousel images to reduce data usage.
 * For full-size preview (lightbox), use the original URL.
 */
export function getHiveProxyThumbnailUrl(url: string, maxWidth = 350): string {
  if (!url || typeof url !== 'string') return url
  const size = `${maxWidth}x0`
  return `${HIVE_IMAGE_PROXY_BASE}/${size}/${url}`
}
