/**
 * Extract image URLs from a normalized post (json_metadata + markdown body).
 */
import type { NormalizedPost } from './types'

/** Capture markdown image URL; [^)]+ allows query string and avoids cutting at & or space */
const MARKDOWN_IMG_REGEX = /!\[[^\]]*\]\s*\((https?:\/\/[^)]+)\)/g

/** Decode a URL for comparison so that `%2C` and `,` are treated as the same. */
function normalizeUrlForDedup(url: string): string {
  try { return decodeURIComponent(url) } catch { return url }
}

function getMetadataImages(jsonMetadata: string | undefined): string[] {
  if (!jsonMetadata || typeof jsonMetadata !== 'string') return []
  try {
    const trimmed = jsonMetadata.trim()
    if (!trimmed) return []
    const meta = JSON.parse(trimmed) as {
      image?: string | string[]
      images?: string | string[]
      video?: { thumbnail?: string } | Record<string, unknown>
    }

    const out: string[] = []
    const seen = new Set<string>()

    const addUrl = (u: string) => {
      if (typeof u !== 'string' || u.length === 0) return
      const normalized = normalizeUrlForDedup(u)
      if (!seen.has(normalized)) {
        seen.add(normalized)
        out.push(u)
      }
    }

    // Handle "image" (string or array)
    if (Array.isArray(meta.image)) {
      meta.image.forEach(addUrl)
    } else if (meta.image) {
      addUrl(meta.image)
    }

    // Handle "images" (string or array)
    if (Array.isArray(meta.images)) {
      meta.images.forEach(addUrl)
    } else if (meta.images) {
      addUrl(meta.images)
    }

    const thumb =
      meta.video && typeof meta.video === 'object'
        ? (meta.video as { thumbnail?: string }).thumbnail
        : undefined
    if (typeof thumb === 'string' && thumb.length > 0) {
      addUrl(thumb)
    }

    return out
  } catch {
    return []
  }
}

function getBodyImageUrls(body: string): string[] {
  if (!body || typeof body !== 'string') return []
  const urls: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(MARKDOWN_IMG_REGEX.source, 'g')
  while ((m = re.exec(body)) !== null) {
    const url = m[1]?.trim()
    if (url && !urls.includes(url)) urls.push(url)
  }
  return urls
}

/** Combined list: metadata images first, then body images (no duplicates). */
export function getPostImageUrls(post: NormalizedPost): string[] {
  const fromMeta = getMetadataImages(post.json_metadata)
  const fromBody = getBodyImageUrls(post.body)
  const seen = new Set(fromMeta.map(normalizeUrlForDedup))
  const out = [...fromMeta]
  for (const u of fromBody) {
    const normalized = normalizeUrlForDedup(u)
    if (!seen.has(normalized)) {
      seen.add(normalized)
      out.push(u)
    }
  }
  return out
}
