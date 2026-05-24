// Offscreen document for AI inference (Manifest V3)
import * as webllm from '../webllm-npm.js';

const MODEL_ID = "gemma-2-2b-it-q4f16_1-MLC";

const MESSAGE_TYPES = {
  LOAD_MODEL: 'LOAD_MODEL',
  SUMMARIZE: 'SUMMARIZE',
  PROGRESS: 'PROGRESS',
  TOKEN: 'TOKEN',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
  READY: 'READY'
};

const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 8000
};

let engine = null;
let modelLoading = false;
let modelLoadPromise = null;
let _cachedBackend = null;

function _retryDelay(attempt) {
  const delay = Math.min(RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt), RETRY_CONFIG.MAX_DELAY_MS);
  const jitter = delay * 0.1 * Math.random();
  return Math.floor(delay + jitter);
}

function _isEngineCorrupted(error) {
  const msg = error.message || '';
  return msg.includes('WebGPU') || msg.includes('device lost') || msg.includes('GPU');
}

// Detect best cache backend (cached once per session)
async function detectOptimalBackend() {
  if (_cachedBackend !== null) return _cachedBackend;

  try {
    if ('getDirectory' in FileSystemDirectoryHandle.prototype) {
      _cachedBackend = "opfs";
      console.log("[offscreen] ✅ OPFS supported - using for optimal cache performance");
      return _cachedBackend;
    }
  } catch (e) {
    console.log("[offscreen] OPFS not supported, falling back to IndexedDB");
  }

  _cachedBackend = "indexeddb";
  return _cachedBackend;
}

// Detect WebGPU support for graceful fallback
async function detectGPUSupport() {
  try {
    const adapter = await navigator.gpu?.requestAdapter?.();
    if (adapter) {
      console.log("[offscreen] ✅ WebGPU available - GPU acceleration enabled");
      return true;
    }
  } catch (e) {
    console.log("[offscreen] WebGPU not available, falling back to WASM");
  }
  return false;
}

console.log("[offscreen] Offscreen document loaded");

async function _runInference(request) {
  console.log("[offscreen] Starting summarization with style:", request.style);

  const style = request.style || "summary";
  let systemPrompt, userPrompt;
  const { chunkIndex, totalChunks, isChunk, isFinalSummary, isShortText } = request;

  // Short text mode - TL;DR for social media and chat
  if (isShortText) {
    systemPrompt = `You are a master of concise communication. Distill the text into a single sharp TL;DR suitable for sharing on social media or chat.

RULES:
- ONE sentence maximum. If impossible, use TWO sentences only
- Maximum 30 words total
- Lead with the main finding or insight
- Make it punchy and shareable
- No "In summary" or meta phrases`;
    userPrompt = `Create a TL;DR (one sentence, max 30 words):\n\n${request.text}`;
  } else if (isFinalSummary) {
    systemPrompt = `You are an expert synthesis researcher. Your role: merge multiple summaries into ONE coherent narrative revealing the author's core finding, not a collection of repeated points.

CRITICAL RULES (no exceptions):
- ELIMINATE ALL REPETITION: No point appears twice. Check each bullet against all others.
- PRIORITIZE: Lead with the main finding/number (the 6%, the 3x threshold, the core insight)
- ONE HEADING ONLY: Single # title capturing the overall argument, not multiple similar headings
- QUANTIFY: Include specific numbers, percentages, measurements where available
- METHODOLOGY FIRST: Explain HOW the finding was discovered before listing implications
- ACTIONABLE INSIGHTS: End with recommendations/what to do with this knowledge
- FORMAT: # Main Finding\\n\\nBackground context.\\n\\n**Key insight 1**: Why it matters.\\n**Key insight 2**: Implication.\\n**Key insight 3**: What to do about it.
- Each point max 15 words, bold only critical metrics
- Maximum 120 words total`;

    userPrompt = `Synthesize these chunk summaries into one coherent markdown summary revealing the author's core message:\n\n${request.text}`;
  } else {
    // Chunk prompt - descriptive extraction for final synthesis
    systemPrompt = `You are an expert editorial analyst extracting comprehensive insights from content. Your role is to capture what the author is communicating with enough detail that these insights can be synthesized into a coherent full summary.

INSTRUCTIONS:
- Format: # [Heading capturing main topic]\\n\\n**Key finding**: 1-2 sentences explaining the core claim or discovery\\n\\n**Supporting evidence**: Specific examples, numbers, methodologies, or reasoning\\n\\n**Why it matters**: Implications and significance\\n\\n**Context**: How this relates to broader themes
- Extract specific numbers, percentages, measurements when available
- Include the methodology/HOW if explaining a finding
- Go deeper than surface facts - explain implications and connections
- Use **bold** for critical metrics and concepts
- Provide enough context that someone reading only this can understand the significance
- Maximum 180 words total`;
    userPrompt = `As an editorial analyst, extract the author's key findings and supporting evidence from this section with enough detail for synthesis:\n\n${request.text}`;
  }

  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: userPrompt
    }
  ];

  const asyncGen = await engine.chat.completions.create({
    model: MODEL_ID,
    messages: messages,
    stream: true,
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 200
  });

  const summaryTokens = [];
  for await (const chunk of asyncGen) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      summaryTokens.push(token);
      chrome.runtime.sendMessage(
        {
          type: MESSAGE_TYPES.TOKEN,
          token: token,
          requestId: request.requestId,
          chunkIndex: chunkIndex,
          totalChunks: totalChunks,
          isFinalSummary: isFinalSummary
        },
        () => {}
      );
    }
  }

  chrome.runtime.sendMessage(
    {
      type: MESSAGE_TYPES.COMPLETE,
      summary: summaryTokens.join(''),
      requestId: request.requestId,
      chunkIndex: chunkIndex,
      totalChunks: totalChunks,
      isFinalSummary: isFinalSummary
    },
    () => {}
  );
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    if (request.type === MESSAGE_TYPES.LOAD_MODEL) {
      console.log("[offscreen] Load model request received");

      // If model is already loaded, respond immediately
      if (engine) {
        console.log("[offscreen] Model already loaded in memory");
        chrome.runtime.sendMessage(
          { type: MESSAGE_TYPES.READY, requestId: request.requestId },
          () => {}
        );
        sendResponse({ success: true });
        return;
      }

      // If model is currently loading, wait for it
      if (modelLoading) {
        console.log("[offscreen] Model is loading, waiting...");
        await modelLoadPromise;
        chrome.runtime.sendMessage(
          { type: MESSAGE_TYPES.READY, requestId: request.requestId },
          () => {}
        );
        sendResponse({ success: true });
        return;
      }

      // Start loading model
      modelLoading = true;
      modelLoadPromise = (async () => {
        try {
          console.log("[offscreen] Creating MLCEngine...");
          const cacheBackend = await detectOptimalBackend();

          engine = await webllm.CreateMLCEngine(MODEL_ID, {
            cacheBackend: cacheBackend,
            prefill_chunk_size: 1024,
            initProgressCallback: (info) => {
              console.log(`[offscreen] Progress: ${info.text}`);

              // Calculate percentage from the info text
              let percent = 0;
              if (info.text && info.text.includes("%")) {
                const match = info.text.match(/(\d+)%/);
                if (match) {
                  percent = parseInt(match[1]);
                }
              }

              chrome.runtime.sendMessage(
                {
                  type: MESSAGE_TYPES.PROGRESS,
                  text: info.text || "Loading...",
                  percent: percent,
                  requestId: request.requestId
                },
                () => {}
              );
            }
          });

          console.log("[offscreen] Model loaded successfully");
          modelLoading = false;
        } catch (error) {
          console.error("[offscreen] Model load error:", error);
          modelLoading = false;
          throw error;
        }
      })();

      await modelLoadPromise;

      console.log("[offscreen] Sending READY signal");
      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.READY, requestId: request.requestId },
        () => {}
      );
      sendResponse({ success: true });
    } else if (request.type === MESSAGE_TYPES.SUMMARIZE) {
      // If engine is null but model should be loaded, try loading it first
      if (!engine) {
        console.log("[offscreen] Engine null, attempting to load model...");
        modelLoading = true;
        modelLoadPromise = (async () => {
          try {
            const cacheBackend = await detectOptimalBackend();
            engine = await webllm.CreateMLCEngine(MODEL_ID, {
              cacheBackend: cacheBackend,
              prefill_chunk_size: 1024,
              initProgressCallback: (info) => {
                console.log(`[offscreen] Reloading: ${info.text}`);
              }
            });
            console.log("[offscreen] Model reloaded successfully");
            modelLoading = false;
          } catch (error) {
            console.error("[offscreen] Model reload error:", error);
            modelLoading = false;
            throw error;
          }
        })();

        await modelLoadPromise;
      }

      if (!engine) {
        throw new Error("Model not loaded");
      }

      // Inference with retry logic
      let lastError = null;
      for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_ATTEMPTS; attempt++) {
        try {
          if (attempt > 0) {
            const delay = _retryDelay(attempt - 1);
            console.log(`[offscreen] Retry attempt ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          await _runInference(request);
          lastError = null;
          break; // Success — exit retry loop
        } catch (err) {
          lastError = err;
          console.warn(`[offscreen] Inference attempt ${attempt + 1} failed:`, err.message);

          // If the engine appears corrupted, clear it so model reload path triggers next time
          if (_isEngineCorrupted(err)) {
            console.warn("[offscreen] Engine error detected, resetting engine state");
            engine = null;
          }
        }
      }

      if (lastError) {
        throw lastError; // Will be caught by outer try/catch, which sends ERROR message
      }

      sendResponse({ success: true });
    }
  } catch (error) {
    console.error("[offscreen] Error:", error);
    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPES.ERROR,
        error: error.message,
        requestId: request.requestId
      },
      () => {}
    );
    sendResponse({ success: false, error: error.message });
  }

  return true;
});
