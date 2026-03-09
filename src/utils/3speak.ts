/**
 * Parse 3speak.tv URLs to extract author and permlink for the player.
 * Supports: watch?v=author/permlink, watch?author=...&permlink=..., embed?v=...
 */
export function parse3SpeakUrl(url: string): { author: string; permlink: string } | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed.includes('3speak.tv')) return null
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (!u.hostname.endsWith('3speak.tv')) return null

    // ?v=author/permlink or ?v=author%2Fpermlink
    const v = u.searchParams.get('v')
    if (v) {
      const decoded = decodeURIComponent(v)
      const slash = decoded.indexOf('/')
      if (slash !== -1) {
        const author = decoded.slice(0, slash).trim()
        const permlink = decoded.slice(slash + 1).trim()
        if (author && permlink) return { author, permlink }
      }
    }

    // ?author=...&permlink=...
    const author = u.searchParams.get('author')?.trim()
    const permlink = u.searchParams.get('permlink')?.trim()
    if (author && permlink) return { author, permlink }

    return null
  } catch {
    return null
  }
}

export function is3SpeakUrl(url: string): boolean {
  return parse3SpeakUrl(url) !== null
}

/** Regex for 3speak.tv video URLs (embed, watch, etc.). */
const THREESPEAK_URL_REGEX = /https:\/\/(?:play\.)?3speak\.tv\/[^\s"'<>)]+/gi

/**
 * Turn bare 3speak URLs in HTML into <a> tags so they can be found and replaced with the player.
 * Only replaces in text (splits by " to avoid changing URLs inside href="...")
 */
export function htmlEnsure3speakLinks(html: string): string {
  const parts = html.split('"')
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i]!.replace(THREESPEAK_URL_REGEX, (url) =>
      `<a href="${url}" class="text-[#e31337] underline">video</a>`
    )
  }
  return parts.join('"')
}

/** True if content (e.g. post body or metadata) contains a 3speak.tv link. */
export function contentHas3SpeakEmbed(body: string, jsonMetadata?: string): boolean {
  if (body?.includes('3speak.tv')) return true
  if (jsonMetadata) {
    try {
      const s = typeof jsonMetadata === 'string' ? jsonMetadata : JSON.stringify(jsonMetadata)
      if (s.includes('3speak.tv')) return true
    } catch {
      /* ignore */
    }
  }
  return false
}
