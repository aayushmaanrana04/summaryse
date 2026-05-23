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

      const style = request.style || "bullets";
      let systemPrompt, userPrompt;
      const { chunkIndex, totalChunks, isChunk, isFinalSummary } = request;

      // Adjust prompts for final summary refinement
      if (isFinalSummary) {
        systemPrompt = "You are an expert at synthesizing summaries. Combine these chunk summaries into a single, coherent summary. Eliminate redundancy and create a natural flow. Maintain the same format as the input.";
        userPrompt = `Synthesize these chunk summaries into one cohesive summary:\n\n${request.text}`;
      } else if (style === "tldr") {
        systemPrompt = "You are a concise summarization expert. Provide a one-sentence summary that captures the core idea. Be direct and factual. Maximum 15 words.";
        userPrompt = `In one sentence, what is the main idea of this text?\n\nText:\n${request.text}`;
      } else if (style === "paragraph") {
        systemPrompt = "You are a skilled summarizer. Write a 2-3 sentence paragraph that captures the essence of the text. Be clear and natural. No bullet points.";
        userPrompt = `Write a 2-3 sentence summary of this text as a paragraph:\n\nText:\n${request.text}`;
      } else if (style === "takeaways") {
        systemPrompt = "You are a summarization expert. List 3-4 key takeaways with brief explanations. Format as:\n• Takeaway: 1-line explanation\n\nBe specific and actionable.";
        userPrompt = `What are the 3-4 most important takeaways from this text?\n\nText:\n${request.text}`;
      } else {
        // bullets (default)
        systemPrompt = "You are a concise summarization expert. Extract key information and present as bullet points. Each bullet should be clear, factual, and under 20 words. No fluff or explanations.";
        userPrompt = `Summarize the key points from this text as bullet points. Include 3-5 main ideas.\n\nText:\n${request.text}`;
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
        temperature: 0.3,
        top_p: 0.95,
        max_tokens: 400
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
