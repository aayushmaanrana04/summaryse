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
