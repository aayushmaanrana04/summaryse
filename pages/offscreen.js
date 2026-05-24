// Offscreen document for AI inference (Manifest V3)
import * as webllm from '../webllm-npm.js';

const MODEL_ID = "gemma-2-2b-it-q4f16_1-MLC";
let engine = null;
let modelLoading = false;
let modelLoadPromise = null;

console.log("[offscreen] Offscreen document loaded");

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    if (request.type === "LOAD_MODEL") {
      console.log("[offscreen] Load model request received");

      // If model is already loaded, respond immediately
      if (engine) {
        console.log("[offscreen] Model already loaded in memory");
        chrome.runtime.sendMessage(
          { type: "READY", requestId: request.requestId },
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
          { type: "READY", requestId: request.requestId },
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
          engine = await webllm.CreateMLCEngine(MODEL_ID, {
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
                  type: "PROGRESS",
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
        { type: "READY", requestId: request.requestId },
        () => {}
      );
      sendResponse({ success: true });
    } else if (request.type === "SUMMARIZE") {
      // If engine is null but model should be loaded, try loading it first
      if (!engine) {
        console.log("[offscreen] Engine null, attempting to load model...");
        modelLoading = true;
        modelLoadPromise = (async () => {
          try {
            engine = await webllm.CreateMLCEngine(MODEL_ID, {
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

      /* COMMENTED OUT - keeping only one unified prompt style for clarity
      // } else if (style === "tldr") {
      //   systemPrompt = "One sentence summary only. Maximum 12 words. Be direct and factual.";
      //   userPrompt = `One sentence summary:\n\n${request.text}`;
      // } else if (style === "paragraph") {
      //   systemPrompt = "Write 2 sentences maximum. Use markdown for emphasis. Capture the essence only.";
      //   userPrompt = `2 sentence summary in markdown:\n\n${request.text}`;
      // } else if (style === "takeaways") {
      //   systemPrompt = "List 3 key takeaways only. Use markdown bullet points and **bold** for important terms. Keep each under 15 words.";
      //   userPrompt = `3 main takeaways:\n\n${request.text}`;
      // } else {
      //   // bullets (default)
      //   systemPrompt = "Extract 3-4 key points as markdown bullets. Each bullet max 15 words. Use **bold** for key terms only.";
      //   userPrompt = `Bullet summary (3-4 points):\n\n${request.text}`;
      // }
      */

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

      let summary = "";
      for await (const chunk of asyncGen) {
        const token = chunk.choices[0]?.delta?.content || "";
        if (token) {
          summary += token;
          chrome.runtime.sendMessage(
            {
              type: "TOKEN",
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
          type: "COMPLETE",
          summary: summary,
          requestId: request.requestId,
          chunkIndex: chunkIndex,
          totalChunks: totalChunks,
          isFinalSummary: isFinalSummary
        },
        () => {}
      );

      sendResponse({ success: true });
    }
  } catch (error) {
    console.error("[offscreen] Error:", error);
    chrome.runtime.sendMessage(
      {
        type: "ERROR",
        error: error.message,
        requestId: request.requestId
      },
      () => {}
    );
    sendResponse({ success: false, error: error.message });
  }

  return true;
});
