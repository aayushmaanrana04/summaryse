// Web Worker for text chunking - offload from main thread
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function splitIntoChunks(text, maxTokensPerChunk = 1500) {
  const estimatedTotalTokens = estimateTokens(text);

  if (estimatedTotalTokens <= maxTokensPerChunk) {
    return [{ text: text, index: 0, totalChunks: 1 }];
  }

  const charPerToken = text.length / estimatedTotalTokens;
  const charsPerChunk = Math.floor(maxTokensPerChunk * charPerToken);

  const chunks = [];
  let startIdx = 0;

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

  // Update totalChunks in single pass
  const totalChunks = chunks.length;
  chunks.forEach(chunk => {
    chunk.totalChunks = totalChunks;
  });

  return chunks;
}

self.onmessage = (event) => {
  const { id, text } = event.data;
  try {
    const chunks = splitIntoChunks(text);
    self.postMessage({ id, chunks, error: null });
  } catch (error) {
    self.postMessage({ id, chunks: null, error: error.message });
  }
};
