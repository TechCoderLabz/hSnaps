/**
 * Extract image URLs from a normalized post (json_metadata + markdown body).
 */
import type { NormalizedPost } from './types'

const MARKDOWN_IMG_REGEX = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g

function getMetadataImages(jsonMetadata: string | undefined): string[] {
  if (!jsonMetadata || typeof jsonMetadata !== 'string') return []
  try {
    const trimmed = jsonMetadata.trim()
    if (!trimmed) return []
    const meta = JSON.parse(trimmed) as { image?: string | string[] }
    if (Array.isArray(meta.image)) return meta.image.filter((u): u is string => typeof u === 'string' && u.length > 0)
    if (typeof meta.image === 'string' && meta.image.length > 0) return [meta.image]
    return []
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
