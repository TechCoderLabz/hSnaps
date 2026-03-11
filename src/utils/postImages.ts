/**
 * Extract image URLs from a normalized post (json_metadata + markdown body).
 */
import type { NormalizedPost } from './types'

/** Capture markdown image URL; [^)]+ allows query string and avoids cutting at & or space */
const MARKDOWN_IMG_REGEX = /!\[[^\]]*\]\s*\((https?:\/\/[^)]+)\)/g

function getMetadataImages(jsonMetadata: string | undefined): string[] {
  if (!jsonMetadata || typeof jsonMetadata !== 'string') return []
  try {
    const trimmed = jsonMetadata.trim()
    if (!trimmed) return []
    const meta = JSON.parse(trimmed) as {
      image?: string | string[]
      video?: { thumbnail?: string } | Record<string, unknown>
    }

    const out: string[] = []

    if (Array.isArray(meta.image)) {
      out.push(...meta.image.filter((u): u is string => typeof u === 'string' && u.length > 0))
    } else if (typeof meta.image === 'string' && meta.image.length > 0) {
      out.push(meta.image)
    }

    const thumb =
      meta.video && typeof meta.video === 'object'
        ? (meta.video as { thumbnail?: string }).thumbnail
        : undefined
    if (typeof thumb === 'string' && thumb.length > 0 && !out.includes(thumb)) {
      out.push(thumb)
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
  const seen = new Set(fromMeta)
  const out = [...fromMeta]
  for (const u of fromBody) {
    if (!seen.has(u)) {
      seen.add(u)
      out.push(u)
    }
  }
  return out
}
