// Web Worker for text chunking - offload from main thread

function estimateTokens(text) {
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return Math.ceil(wordCount * 1.4);
}

let _segmenterCache = null;

function segmentSentences(text) {
  try {
    if (!_segmenterCache) {
      _segmenterCache = new Intl.Segmenter('en', { granularity: 'sentence' });
    }
    return [..._segmenterCache.segment(text)].map(s => s.segment).filter(s => s.trim().length > 0);
  } catch (_) {
    return (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text]).filter(s => s.trim().length > 0);
  }
}

function packSentencesIntoChunks(sentences, maxTokens) {
  const chunks = [];
  let currentParts = [];
  let currentTokens = 0;

  // Cache token counts to avoid recalculating per sentence
  const sentenceTokenMap = new Map(sentences.map(s => [s, estimateTokens(s)]));

  for (const sentence of sentences) {
    const sentTokens = sentenceTokenMap.get(sentence);

    if (sentTokens > maxTokens) {
      if (currentParts.length > 0) {
        chunks.push(currentParts.join(''));
        currentParts = [];
        currentTokens = 0;
      }
      const words = sentence.split(/\s+/).filter(w => w.length > 0);
      let wordBuf = [];
      let wordTokens = 0;
      for (const word of words) {
        if (wordTokens + 1 > maxTokens && wordBuf.length > 0) {
          chunks.push(wordBuf.join(' '));
          wordBuf = [word];
          wordTokens = 1;
        } else {
          wordBuf.push(word);
          wordTokens += 1;
        }
      }
      if (wordBuf.length > 0) chunks.push(wordBuf.join(' '));
      continue;
    }

    if (currentTokens + sentTokens > maxTokens && currentParts.length > 0) {
      chunks.push(currentParts.join(''));
      currentParts = [sentence];
      currentTokens = sentTokens;
    } else {
      currentParts.push(sentence);
      currentTokens += sentTokens;
    }
  }

  if (currentParts.length > 0) {
    chunks.push(currentParts.join(''));
  }

  return chunks;
}

function splitIntoChunks(text, maxTokensPerChunk = 1500) {
  if (estimateTokens(text) <= maxTokensPerChunk) {
    return [{ text, index: 0, totalChunks: 1 }];
  }

  const rawChunks = packSentencesIntoChunks(segmentSentences(text), maxTokensPerChunk);
  return rawChunks.map((t, i) => ({ text: t, index: i, totalChunks: rawChunks.length }));
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
