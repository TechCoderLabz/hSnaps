import { proxyImageUrl } from './imageProxy'

/** Escape HTML for safe use in attributes and text. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Trim markdown to plain text + links only (no images, no formatting, no raw URLs/HTML).
 * Returns HTML safe to render: paragraphs and <a> tags only.
 */
export function markdownToTrimmedHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return ''

  let s = markdown
  // Normalize line endings so newlines are preserved correctly
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Remove image syntax entirely
  s = s.replace(/!\[[^\]]*\]\([^)]+\)/g, '')

  // Replace link [text](url) with <a> (link text kept, URL in href)
  s = s.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (_, text: string, url: string) => {
    const href = url.trim().replace(/^["']|["']$/g, '')
    const label = escapeHtml((text || href).trim())
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-[#e31337] underline">${label}</a>`
  })

  // Remove bold/italic: keep inner text only
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/_([^_]+)_/g, '$1')
  s = s.replace(/~~([^~]+)~~/g, '$1')
  s = s.replace(/`([^`]+)`/g, '$1')

  // Remove header markers
  s = s.replace(/^#+\s+/gm, '')

  // Remove remaining HTML tags
  s = s.replace(/<[^>]+>/g, '')

  // Remove bare URLs except 3speak.tv (so 3speak can be turned into the embed player)
  s = s.replace(/\bhttps?:\/\/[^\s<>)\]]+/gi, (url) =>
    url.includes('3speak.tv') ? url : ''
  )

  // Preserve newlines: only collapse spaces within each line, trim lines
  s = s
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .trim()

  if (!s) return ''

  // Split by one or more blank lines = paragraph boundaries; single \n = line break within paragraph
  const paragraphClass = 'text-sm text-zinc-300 leading-relaxed break-words whitespace-normal'
  const paragraphs = s
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return paragraphs
    .map((p) => `<p class="${paragraphClass}">${p.replace(/\n/g, '<br />')}</p>`)
    .join('')
}

// Simple markdown to HTML converter for basic markdown features
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;

  // Replace images first — proxy all URLs and escape alt text
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match: string, alt: string, url: string) => {
    const proxied = escapeHtml(proxyImageUrl(url.trim(), 640))
    const safeAlt = escapeHtml(alt)
    return `<div class="my-6"><img src="${proxied}" alt="${safeAlt}" class="max-w-full rounded-lg shadow-lg border border-slate-800/50 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" /></div>`
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-white">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-7 mb-4 text-white">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-5 text-white">$1</h1>');

  // Links (but not images which we already processed) — escape href and text
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match: string, text: string, url: string) => {
    const safeHref = escapeHtml(url.trim())
    const safeText = escapeHtml(text)
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-teal-400 hover:text-teal-300 underline">${safeText}</a>`
  });

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold text-white">$1</strong>');

  // Italic
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  // Split into paragraphs
  const lines = html.split('\n');
  const result: string[] = [];
  let currentPara: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // If it's a block element (img, header, div), add it directly
    if (trimmed.match(/^<(img|h[1-3]|div)/i)) {
      if (currentPara.length > 0) {
        result.push(`<p class="mb-4 text-slate-300 leading-relaxed">${currentPara.join(' ')}</p>`);
        currentPara = [];
      }
      result.push(trimmed);
    } else if (trimmed === '') {
      // Empty line - end current paragraph
      if (currentPara.length > 0) {
        result.push(`<p class="mb-4 text-slate-300 leading-relaxed">${currentPara.join(' ')}</p>`);
        currentPara = [];
      }
    } else {
      // Regular text line
      currentPara.push(trimmed);
    }
  }

  // Add remaining paragraph
  if (currentPara.length > 0) {
    result.push(`<p class="mb-4 text-slate-300 leading-relaxed">${currentPara.join(' ')}</p>`);
  }

  return result.join('');
}
