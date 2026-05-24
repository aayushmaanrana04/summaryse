// Utilities for large text handling and chunking
// ES module version for Svelte components

// Rough token estimation (1 token ≈ 4 characters)
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Split text into chunks (simple, ultra-fast)
export function splitIntoChunks(text, maxTokensPerChunk = 1500) {
  const estimatedTotalTokens = estimateTokens(text);

  // If text is small, return as single chunk
  if (estimatedTotalTokens <= maxTokensPerChunk) {
    return [{ text: text, index: 0, totalChunks: 1 }];
  }

  // Calculate target character length per chunk
  const charPerToken = text.length / estimatedTotalTokens;
  const charsPerChunk = Math.floor(maxTokensPerChunk * charPerToken);

  const chunks = [];
  let startIdx = 0;

  // Ultra-simple: split by character count
  while (startIdx < text.length) {
    const endIdx = Math.min(startIdx + charsPerChunk, text.length);
    const chunkText = text.substring(startIdx, endIdx).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        index: chunks.length,
        totalChunks: -1
      });
    }

    startIdx = endIdx;
  }

  // Update totalChunks
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
  });

  return chunks;
}

// Check if text is large enough to require chunking
// Threshold: 1,300 tokens (slightly below one chunk max of 1,500)
export function isLargeText(text, tokenThreshold = 1300) {
  return estimateTokens(text) > tokenThreshold;
}

// Get a chunk size estimate for display
export function getChunkEstimate(text, maxTokensPerChunk = 1500) {
  const totalTokens = estimateTokens(text);
  return Math.ceil(totalTokens / maxTokensPerChunk);
}

// Parse markdown and convert to safe HTML - strict mode
export function parseMarkdown(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Headings (h1-h3) - only at line start
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold - must be before italic (strict: no whitespace inside)
  html = html.replace(/\*\*([^\s].*?[^\s])\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*\*([^\s])\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([\S].*?[\S])__/g, '<strong>$1</strong>');

  // Italic - only with non-whitespace content
  html = html.replace(/\*([^\s\*].*?[^\s\*])\*/g, '<em>$1</em>');
  html = html.replace(/\*([^\s\*])\*/g, '<em>$1</em>');
  html = html.replace(/_([^\s_].*?[^\s_])_/g, '<em>$1</em>');
  html = html.replace(/_([^\s_])_/g, '<em>$1</em>');

  // Inline code (backticks) - strict
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links [text](url) - validate URL format
  html = html.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists - convert markdown lists to HTML
  // Process bullet lists
  const listItems = html.match(/^[\s]*[-•*+]\s+(.+)$/gm) || [];
  if (listItems.length > 0) {
    let listHtml = '<ul>';
    listItems.forEach(item => {
      const text = item.replace(/^[\s]*[-•*+]\s+/, '').trim();
      listHtml += `<li>${text}</li>`;
    });
    listHtml += '</ul>';
    html = html.replace(/(?:^[\s]*[-•*+]\s+.+\n?)+/gm, listHtml);
  }

  // Blockquotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

  // Paragraph breaks - only for double newlines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Skip if already wrapped in tags
      if (p.match(/^<[h|u|b|l|blockquote|code]/)) return p;
      return `<p>${p}</p>`;
    })
    .join('');

  return html;
}

// Parse bullet points from text
export function parseBullets(text) {
  if (!text) return [];
  return text
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim();
      return cleaned || line.trim();
    });
}

// Phase constants for state machine
export const PHASES = {
  INIT: 'init',
  LOADING_MODEL: 'loading-model',
  SUMMARIZING: 'summarizing',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  ERROR: 'error'
};
