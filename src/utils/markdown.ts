// Simple markdown to HTML converter for basic markdown features
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;

  // Replace images first
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="my-6"><img src="$2" alt="$1" class="max-w-full rounded-lg shadow-lg border border-slate-800/50 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" onclick="window.open(\'$2\', \'_blank\')" /></div>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-white">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-7 mb-4 text-white">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-5 text-white">$1</h1>');

  // Links (but not images which we already processed)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-400 hover:text-teal-300 underline">$1</a>');

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
