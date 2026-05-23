var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ai-worker.js
var require_ai_worker = __commonJS({
  "ai-worker.js"() {
    var MODEL_ID = "SmolLM2-135M-Instruct-q0f32-MLC";
    var engine = null;
    var webllm = null;
    console.log("[ai-worker] Worker started");
    self.onmessage = async (event) => {
      const { type, text, requestId } = event.data;
      console.log(`[ai-worker] Received message type: ${type}`);
      try {
        if (type === "LOAD_MODEL") {
          console.log("[ai-worker] Loading model...");
          if (!webllm) {
            console.log("[ai-worker] Importing webllm-npm.js...");
            webllm = await import("./webllm-npm.js");
            console.log("[ai-worker] WebLLM imported successfully");
            console.log("[ai-worker] CreateMLCEngine available:", webllm.CreateMLCEngine ? "\u2705" : "\u274C");
            console.log("[ai-worker] prebuiltAppConfig available:", webllm.prebuiltAppConfig ? "\u2705" : "\u274C");
            if (webllm.prebuiltAppConfig && webllm.prebuiltAppConfig.model_list) {
              const smollmModels = webllm.prebuiltAppConfig.model_list.filter((m) => m.model_id.includes("SmolLM2"));
              console.log(`[ai-worker] SmolLM2 models: ${smollmModels.map((m) => m.model_id).join(", ")}`);
            }
          }
          if (!webllm.CreateMLCEngine) {
            throw new Error("CreateMLCEngine not found. WebLLM exports: " + Object.keys(webllm).join(", "));
          }
          console.log(`[ai-worker] Creating MLCEngine for ${MODEL_ID}...`);
          engine = await webllm.CreateMLCEngine(MODEL_ID, {
            initProgressCallback: (info) => {
              console.log(`[ai-worker] Progress: ${info.text}`);
              self.postMessage({
                type: "PROGRESS",
                text: info.text || "Loading...",
                requestId
              });
            }
          });
          console.log("[ai-worker] Model loaded successfully");
          self.postMessage({ type: "READY", requestId });
        } else if (type === "SUMMARIZE") {
          if (!engine) {
            throw new Error("Model not loaded");
          }
          const messages = [
            {
              role: "system",
              content: "You are a concise summarization assistant. Generate factual, readable, concise summaries. Avoid fluff."
            },
            {
              role: "user",
              content: `Summarize this content:

${text}`
            }
          ];
          const asyncGen = await engine.chat.completions.create({
            model: MODEL_ID,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1e3
          });
          let summary = "";
          for await (const chunk of asyncGen) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
              summary += token;
              self.postMessage({
                type: "TOKEN",
                token,
                requestId
              });
            }
          }
          self.postMessage({
            type: "COMPLETE",
            summary,
            requestId
          });
        }
      } catch (error) {
        self.postMessage({
          type: "ERROR",
          error: error.message,
          requestId
        });
      }
    };
  }
});
export default require_ai_worker();
