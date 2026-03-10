/**
 * Parse post body (markdown) into plain text and media URLs for feed item display.
 * No Hive content renderer; we render plain text + swipable images, 3speak, Twitter, YouTube.
 */
import type { NormalizedPost } from './types'
import { getPostImageUrls } from './postImages'
import { parse3SpeakUrl } from './3speak'

const TWITTER_STATUS_REGEX =
  /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/gi
const YOUTUBE_REGEX =
  /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)|https?:\/\/youtu\.be\/([^?\s]+)|https?:\/\/(?:www\.)?youtube\.com\/shorts\/([^?\s]+)/gi
const THREE_SPEAK_REGEX = /https?:\/\/(?:play\.)?3speak\.tv\/[^\s"'<>)]+/gi
const ANY_URL_REGEX = /\bhttps?:\/\/[^\s<>)\]]+/gi

/** Remove Liketu promo block: "---" + "For the best experience view this post on Liketu" */
function stripLiketuPromo(body: string): string {
  if (!body || typeof body !== 'string') return body
  return body
    .replace(/\n?---\s*\n\s*For the best experience view this post on Liketu\s*/gi, '')
    .trim()
}

export interface ParsedPostBody {
  plainText: string
  imageUrls: string[]
  threeSpeakUrls: Array<{ url: string; author: string; permlink: string }>
  twitterStatusIds: string[]
  youtubeVideoIds: string[]
}

function extractTwitterIds(text: string): string[] {
  const ids: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(TWITTER_STATUS_REGEX.source, 'gi')
  while ((m = re.exec(text)) !== null) {
    const id = m[1]
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

function extractYoutubeIds(text: string): string[] {
  const ids: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(YOUTUBE_REGEX.source, 'gi')
  while ((m = re.exec(text)) !== null) {
    const id = m[1] ?? m[2] ?? m[3]
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

function extract3SpeakUrls(text: string): Array<{ url: string; author: string; permlink: string }> {
  const out: Array<{ url: string; author: string; permlink: string }> = []
  let m: RegExpExecArray | null
  const re = new RegExp(THREE_SPEAK_REGEX.source, 'gi')
  while ((m = re.exec(text)) !== null) {
    const url = m[0]!
    const parsed = parse3SpeakUrl(url)
    if (parsed && !out.some((x) => x.url === url)) out.push({ url, ...parsed })
  }
  return out
}

/** Strip markdown to plain text; remove image syntax, replace links with link text, strip formatting. */
function markdownToPlainText(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return ''
  let s = markdown
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  // Remove image syntax
  s = s.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
  // Replace [text](url) with just text
  s = s.replace(/\[([^\]]*)\]\([^)]+\)/g, (_, text: string) => (text || '').trim())
  // Strip bold/italic/code
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/_([^_]+)_/g, '$1')
  s = s.replace(/~~([^~]+)~~/g, '$1')
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/^#+\s+/gm, '')
  s = s.replace(/<[^>]+>/g, '')
  // Collapse spaces within lines, preserve newlines
  s = s
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .trim()
  return s
}

/** Remove media URLs from text so we don't show raw URL when we show embed. */
function stripMediaUrlsFromText(
  text: string,
  threeSpeakUrls: string[],
  twitterIds: string[],
  youtubeIds: string[]
): string {
  let s = text
  for (const url of threeSpeakUrls) {
    s = s.split(url).join('')
  }
  const twitterPattern = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+/gi
  s = s.replace(twitterPattern, '')
  const youtubePattern =
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[^&\s]+|https?:\/\/youtu\.be\/[^?\s]+|https?:\/\/(?:www\.)?youtube\.com\/shorts\/[^?\s]+/gi
  s = s.replace(youtubePattern, '')
  s = s.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
  return s
}

/** Extract bare image URLs from body (e.g. https://img.leopedia.io/.../image.png) for the carousel. */
function extractStandaloneImageUrls(body: string): string[] {
  if (!body || typeof body !== 'string') return []
  const urls: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(ANY_URL_REGEX.source, 'gi')
  while ((m = re.exec(body)) !== null) {
    const url = m[0]?.trim()
    if (url && isImageUrl(url) && !urls.includes(url)) urls.push(url)
  }
  return urls
}

/** Remove standalone image URLs from text so they only appear in the image carousel. */
function stripStandaloneImageUrlsFromText(text: string, imageUrls: string[]): string {
  let s = text
  for (const url of imageUrls) {
    s = s.split(url).join(' ')
  }
  s = s.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
  return s
}

export function parsePostBody(post: NormalizedPost): ParsedPostBody {
  const body = stripLiketuPromo(post.body ?? '')
  const imageUrlsFromMetaAndMarkdown = getPostImageUrls(post)
  const standaloneImageUrls = extractStandaloneImageUrls(body)
  const seen = new Set(imageUrlsFromMetaAndMarkdown)
  const imageUrls = [...imageUrlsFromMetaAndMarkdown]
  for (const u of standaloneImageUrls) {
    if (!seen.has(u)) {
      seen.add(u)
      imageUrls.push(u)
    }
  }

  const threeSpeakFromBody = extract3SpeakUrls(body)
  const threeSpeakFromMeta: Array<{ url: string; author: string; permlink: string }> = []

  if (post.json_metadata && typeof post.json_metadata === 'string') {
    try {
      const meta = JSON.parse(post.json_metadata) as {
        video?: { url?: string } | Record<string, unknown>
      }
      const videoUrl =
        meta.video && typeof meta.video === 'object'
          ? (meta.video as { url?: string }).url
          : undefined
      if (typeof videoUrl === 'string' && videoUrl.includes('3speak.tv')) {
        const parsed = parse3SpeakUrl(videoUrl)
        if (parsed) {
          threeSpeakFromMeta.push({ url: videoUrl, ...parsed })
        }
      }
    } catch {
      // ignore malformed json_metadata
    }
  }

  const threeSpeakUrls: Array<{ url: string; author: string; permlink: string }> = [
    ...threeSpeakFromBody,
  ]
  for (const item of threeSpeakFromMeta) {
    if (!threeSpeakUrls.some((x) => x.url === item.url)) {
      threeSpeakUrls.push(item)
    }
  }

  const twitterStatusIds = extractTwitterIds(body)
  const youtubeVideoIds = extractYoutubeIds(body)

  let plainText = markdownToPlainText(body)
  plainText = stripMediaUrlsFromText(
    plainText,
    threeSpeakUrls.map((x) => x.url),
    twitterStatusIds,
    youtubeVideoIds
  )
  plainText = stripStandaloneImageUrlsFromText(plainText, standaloneImageUrls)

  return {
    plainText,
    imageUrls,
    threeSpeakUrls,
    twitterStatusIds,
    youtubeVideoIds,
  }
}

/** Parse body + json_metadata (e.g. for comments) into same shape as parsePostBody. */
export function parseBodyFromMarkdown(body: string, jsonMetadata?: string): ParsedPostBody {
  const post = { body: body ?? '', json_metadata: jsonMetadata } as NormalizedPost
  return parsePostBody(post)
}

/** URL pattern for link detection in plain text (no media embeds). */
const LINK_URL_REGEX = /\bhttps?:\/\/[^\s<>)\]]+/gi

/** Common image file extensions (case-insensitive). */
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i
/** Known image host path patterns (path contains /image or similar). */
const IMAGE_HOST_PATTERNS = /\.(leopedia\.io|hive\.blog|imgur\.com|i\.imgur\.com)\//i

/** Whether a URL is likely an image (extension or known image host). */
export function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const u = url.trim()
  if (IMAGE_EXT.test(u)) return true
  if (IMAGE_HOST_PATTERNS.test(u)) return true
  return false
}
/** Hashtag: # followed by word chars (letters, numbers, underscore). */
const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g

export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; url: string }
  | { type: 'hashtag'; tag: string }

function splitTextByHashtags(text: string): Array<{ type: 'text'; value: string } | { type: 'hashtag'; tag: string }> {
  const out: Array<{ type: 'text'; value: string } | { type: 'hashtag'; tag: string }> = []
  let lastIndex = 0
  const re = new RegExp(HASHTAG_REGEX.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const tag = m[1]!
    if (m.index > lastIndex) {
      out.push({ type: 'text', value: text.slice(lastIndex, m.index) })
    }
    out.push({ type: 'hashtag', tag })
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    out.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return out.length > 0 ? out : [{ type: 'text', value: text }]
}

/**
 * Split plain text into text, link, and hashtag segments for clickable links and tags.
 */
export function plainTextToSegments(plainText: string): TextSegment[] {
  if (!plainText || typeof plainText !== 'string') return []
  const raw: TextSegment[] = []
  let lastIndex = 0
  const re = new RegExp(LINK_URL_REGEX.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(plainText)) !== null) {
    const url = m[0]!
    if (m.index > lastIndex) {
      raw.push({ type: 'text', value: plainText.slice(lastIndex, m.index) })
    }
    raw.push({ type: 'link', url })
    lastIndex = re.lastIndex
  }
  if (lastIndex < plainText.length) {
    raw.push({ type: 'text', value: plainText.slice(lastIndex) })
  }
  if (raw.length === 0) raw.push({ type: 'text', value: plainText })

  const segments: TextSegment[] = []
  for (const seg of raw) {
    if (seg.type === 'link') {
      segments.push(seg)
    } else if (seg.type === 'text') {
      segments.push(...splitTextByHashtags(seg.value))
    } else {
      segments.push(seg)
    }
  }
  return segments
}

/** Whether a post body or json_metadata tags contain the given tag (case-insensitive). */
export function postMatchesTag(post: NormalizedPost, tagSlug: string): boolean {
  const tagLower = tagSlug.toLowerCase()
  const body = (post.body ?? '').toLowerCase()
  if (body.includes(`#${tagLower}`)) return true
  try {
    const meta = post.json_metadata ? JSON.parse(post.json_metadata) : null
    const tags = Array.isArray(meta?.tags) ? meta.tags : []
    if (tags.some((t: string) => String(t).toLowerCase() === tagLower)) return true
  } catch {
    // ignore parse errors
  }
  return false
}
