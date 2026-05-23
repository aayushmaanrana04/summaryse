// SmolLM2-135M: Smallest, fastest (360MB VRAM, 1-2GB download)
const MODEL_ID = "SmolLM2-135M-Instruct-q0f32-MLC";

class SummarysePopup {
  constructor() {
    this.selectedText = "";
    this.currentSummary = "";
    this.isLoading = false;
    this.engine = null;
    this.modelLoading = false;
    this.modelLoaded = false;
    this.worker = null;
    this.webllmLoaded = false;
    this.librariesAvailable = false;

    this.initElements();
    this.attachEventListeners();
    this.initWorker();
    this.loadSelectedText();
    // Auto-check and potentially summarize
    this.initializeAndSummarize();
  }

  async initializeAndSummarize() {
    try {
      // Check if model is cached
      const status = await this.getLibraryStatus();

      // Ensure model is loaded
      if (!this.modelLoaded) {
        if (!status.model.cached) {
          // Download and load model
          await this.downloadLibraries();
        } else {
          // Just load the model
          await this.preloadModel();
        }
      }

      // If text is selected, auto-summarize
      if (this.selectedText && this.selectedText.trim().length > 0) {
        await this.summarize();
      } else {
        // Show summarize button if no text
        this.summarizeBtn.style.display = "block";
        this.summarizeBtn.disabled = false;
      }
    } catch (error) {
      console.error("Initialization error:", error);
    }
  }

  initWorker() {
    try {
      this.worker = new Worker("ai-worker.js");
      this.worker.onmessage = (event) => this.handleWorkerMessage(event);
    } catch (error) {
      console.error("Failed to create worker:", error);
    }
  }

  handleWorkerMessage(event) {
    const { type, text, token, summary, error } = event.data;

    if (type === "PROGRESS") {
      console.log(`[popup] Progress: ${text}`);
      this.loadingText.textContent = text;
    } else if (type === "TOKEN") {
      this.currentSummary += token;
      this.updateSummaryDisplay();
    } else if (type === "READY") {
      this.modelLoaded = true;
      console.log("✅ [popup] Model loaded in worker");
      // Refresh library status to show model is now cached
      this.checkAndShowLibraryStatus();
    } else if (type === "COMPLETE") {
      this.currentSummary = summary;
      this.showSummary();
    } else if (type === "ERROR") {
      console.error(`[popup] Worker error: ${error}`);
      this.showError(error);
    }
  }

  initElements() {
    this.closeBtn = document.getElementById("closeBtn");
    this.summarizeBtn = document.getElementById("summarizeBtn");
    this.copyBtn = document.getElementById("copyBtn");
    this.newSummarizeBtn = document.getElementById("newSummarizeBtn");
    this.selectedTextEl = document.getElementById("selectedText");
    this.selectedSection = document.getElementById("selectedSection");
    this.summaryEl = document.getElementById("summary");
    this.actionsEl = document.getElementById("actions");
    this.loadingEl = document.getElementById("loading");
    this.loadingText = document.getElementById("loadingText");
    this.statusEl = document.getElementById("status");
    this.errorEl = document.getElementById("error");
  }

  attachEventListeners() {
    this.closeBtn.addEventListener("click", () => this.close());
    this.summarizeBtn.addEventListener("click", () => this.summarize());
    this.copyBtn.addEventListener("click", () => this.copy());
    this.newSummarizeBtn.addEventListener("click", () => this.reset());
  }

  loadSelectedText() {
    console.log("=== loadSelectedText called ===");
    try {
      chrome.storage.local.get("summaryse_selected_text", (result) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Storage error:", chrome.runtime.lastError);
          this.showError("Storage access error. Please try again.");
          return;
        }

        const text = result.summaryse_selected_text;
        if (!text || text.trim().length === 0) {
          console.error("❌ No text in storage");
          this.showError("No text was selected. Please select text on the webpage and try again.");
          return;
        }

        console.log("✅ Text found!");
        this.selectedText = text;
        // Don't show selected text in minimal design
        // const preview = text.length > 200 ? text.substring(0, 200) + "..." : text;
        // this.selectedTextEl.textContent = preview;
        // this.selectedSection.style.display = "block";
      });
    } catch (error) {
      console.error("❌ Failed to load selected text:", error);
      this.showError("Failed to retrieve selected text: " + error.message);
    }
  }

  async checkAndShowLibraryStatus() {
    console.log("Checking library status...");
    try {
      const status = await this.getLibraryStatus();
      console.log("Library status:", status);
      this.showLibraryStatus(status);
    } catch (error) {
      console.error("Failed to check library status:", error);
      this.showError("Failed to check libraries: " + error.message);
    }
  }

  async getLibraryStatus() {
    try {
      let modelCached = false;

      // If model is currently loaded, it's cached
      if (this.modelLoaded) {
        modelCached = true;
      } else {
        // Check if model was cached by WebLLM (creates IndexedDB stores)
        try {
          const dbs = await indexedDB.databases();
          for (const db of dbs) {
            if (db.name && (db.name.includes("weights") || db.name.includes("mlc") || db.name.includes("model"))) {
              modelCached = true;
              break;
            }
          }
        } catch (e) {
          console.log("Could not check model cache");
        }
      }

      console.log("WebLLM bundled: true, Model cached:", modelCached);
      return {
        webllm: { cached: true, size: "Bundled" },
        model: { cached: modelCached, size: "~1-2GB" }
      };
    } catch (error) {
      console.error("Failed to get library status:", error);
      return {
        webllm: { cached: true, size: "Bundled" },
        model: { cached: false, size: "~1-2GB" }
      };
    }
  }

  showLibraryStatus(status) {
    // Minimal design - no status display, just auto-load
    const allAvailable = status.webllm.cached && status.model.cached;

    this.summarizeBtn.disabled = !allAvailable;
    if (!allAvailable) {
      this.summarizeBtn.style.opacity = "0.5";
      this.summarizeBtn.style.cursor = "not-allowed";
    } else {
      this.summarizeBtn.style.opacity = "1";
      this.summarizeBtn.style.cursor = "pointer";
    }
  }

  async downloadLibraries() {
    console.log("Starting library download...");
    this.showLoading("Downloading libraries... This may take several minutes.");

    try {
      // WebLLM is bundled locally
      this.loadingText.textContent = "✅ WebLLM ready (bundled locally)";
      await this.downloadWebLLMLibrary();
      console.log("✅ WebLLM library ready");

      // Initialize engine (which downloads and caches the model)
      this.loadingText.textContent = "📥 Downloading SmolLM2-135M (1-2GB)...\nThis may take 10-30 minutes depending on your connection.\nCheck console (F12) for progress.";
      console.log("⏳ Starting SmolLM2-135M model download (~1-2GB) - check [ai-worker] console logs for progress");
      await this.preloadModel();
      console.log("✅ Model downloaded and cached");

      this.hideLoading();
      this.showStatus("✅ All libraries downloaded! Ready to summarize.");

      // Refresh library status
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.checkAndShowLibraryStatus();
    } catch (error) {
      console.error("Download error:", error);
      this.showError(error.message);
    }
  }

  async downloadWebLLMLibrary() {
    // WebLLM is already bundled and loaded from web-llm.js script tag
    console.log("✅ WebLLM is ready (bundled locally)");
  }

  async preloadModel() {
    console.log("Preloading model...");
    try {
      if (!this.worker) {
        throw new Error("Worker not initialized");
      }

      // Use a one-time listener for READY message instead of replacing onmessage
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Model loading timeout (>10 minutes). Check browser console for progress logs with [ai-worker] prefix."));
        }, 600000); // 10 minute timeout (large model download on first run)

        const messageHandler = (event) => {
          if (event.data.type === "READY") {
            clearTimeout(timeout);
            this.worker.removeEventListener("message", messageHandler);
            this.modelLoaded = true;
            console.log("✅ Model preloaded successfully");
            resolve();
          }
        };

        this.worker.addEventListener("message", messageHandler);

        // Send load command to worker
        console.log("Sending LOAD_MODEL message to worker...");
        this.worker.postMessage({ type: "LOAD_MODEL" });
      });
    } catch (error) {
      throw new Error("Failed to load model: " + error.message);
    }
  }

  showLoading(message = "Initializing...") {
    this.loadingEl.style.display = "flex";
    this.loadingText.textContent = message;
    this.summarizeBtn.disabled = true;
    this.summarySection.style.display = "none";
    this.errorEl.style.display = "none";
  }

  hideLoading() {
    this.loadingEl.style.display = "none";
  }

  showError(message) {
    this.hideLoading();
    this.errorEl.style.display = "block";
    this.errorEl.innerHTML = `<strong>Error:</strong> ${this.escapeHtml(message)}`;
    this.summarySection.style.display = "none";
  }

  showStatus(message) {
    this.statusEl.style.display = "block";
    this.statusEl.innerHTML = message;
  }

  hideStatus() {
    this.statusEl.style.display = "none";
  }

  showSummary() {
    this.hideLoading();
    document.getElementById("summary").style.display = "block";
    document.getElementById("actions").style.display = "flex";
    this.summarizeBtn.style.display = "none";
    this.errorEl.style.display = "none";
  }

  resetUI() {
    document.getElementById("summary").style.display = "none";
    document.getElementById("actions").style.display = "none";
    this.summarizeBtn.style.display = "block";
    this.errorEl.style.display = "none";
    this.loadingEl.style.display = "none";
    this.currentSummary = "";
    this.summaryEl.textContent = "";
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  chunkText(text, maxTokens = 2000) {
    try {
      const paragraphs = text
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      if (paragraphs.length === 0) {
        throw new Error("No content to summarize");
      }

      const chunks = [];
      let currentChunk = "";

      for (const para of paragraphs) {
        const combined = currentChunk ? currentChunk + "\n\n" + para : para;
        if (combined.length / 4 > maxTokens && currentChunk) {
          chunks.push(currentChunk);
          currentChunk = para;
        } else {
          currentChunk = combined;
        }
      }

      if (currentChunk) chunks.push(currentChunk);
      return chunks;
    } catch (error) {
      throw new Error("Failed to process text: " + error.message);
    }
  }

  async streamSummary(text) {
    if (!text || text.trim().length === 0) {
      throw new Error("Empty text cannot be summarized");
    }

    const systemPrompt = `You are a concise summarization assistant.
Generate factual, readable, concise summaries.
Avoid fluff.
Prefer short bullet points or brief paragraphs.`;

    const userPrompt = `Summarize the following content into concise bullet points.

Keep the summary:
- factual
- concise
- easy to scan
- under 5 bullets

Content:

${text}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    try {
      if (!this.modelLoaded) {
        throw new Error("Model not loaded");
      }

      // Send summarization request to worker
      this.worker.postMessage({ type: "SUMMARIZE", text: text });

      // Wait for completion
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Summarization timeout"));
        }, 60000); // 1 minute timeout

        const origOnMessage = this.worker.onmessage;
        this.worker.onmessage = (event) => {
          if (event.data.type === "COMPLETE") {
            clearTimeout(timeout);
            resolve();
            this.worker.onmessage = origOnMessage;
          } else if (event.data.type === "ERROR") {
            clearTimeout(timeout);
            reject(new Error(event.data.error));
            this.worker.onmessage = origOnMessage;
          } else {
            origOnMessage(event);
          }
        };
      });
    } catch (error) {
      throw new Error("Failed to generate summary: " + error.message);
    }
  }

  async summarize() {
    if (!this.selectedText || this.selectedText.trim().length === 0) {
      this.showError("No text selected. Please select text and try again.");
      return;
    }

    // Check if libraries are still available (user might have cleared cache)
    const status = await this.getLibraryStatus();
    if (!status.webllm.cached || !status.model.cached) {
      this.showError("Libraries were cleared. Please download them again.");
      this.checkAndShowLibraryStatus();
      return;
    }

    this.currentSummary = "";
    this.showLoading("Generating summary...");
    this.summarizeBtn.disabled = true;

    try {
      const chunks = this.chunkText(this.selectedText);

      if (chunks.length === 1) {
        await this.streamSummary(chunks[0]);
      } else {
        const summaries = [];
        for (let i = 0; i < chunks.length; i++) {
          this.showStatus(`Processing chunk ${i + 1} of ${chunks.length}...`);
          const tempSummary = this.currentSummary;
          this.currentSummary = "";

          await this.streamSummary(chunks[i]);
          summaries.push(this.currentSummary);
          this.currentSummary = tempSummary;
        }

        const combinedSummaries = summaries.join("\n\n");
        this.showStatus("Combining summaries...");
        this.currentSummary = "";
        await this.streamSummary(combinedSummaries);
      }

      this.showSummary();
    } catch (error) {
      this.showError(error.message || "Failed to generate summary. Please try again.");
    } finally {
      this.summarizeBtn.disabled = false;
    }
  }

  updateSummaryDisplay() {
    this.summaryEl.textContent = this.currentSummary;
    this.showSummary();
  }

  copy() {
    if (!this.currentSummary) {
      this.showError("No summary to copy");
      return;
    }

    navigator.clipboard
      .writeText(this.currentSummary)
      .then(() => {
        const originalText = this.copyBtn.textContent;
        this.copyBtn.textContent = "Copied!";
        setTimeout(() => {
          this.copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        this.showError("Failed to copy: " + err.message);
      });
  }

  reset() {
    this.resetUI();
    this.currentSummary = "";
    this.summaryEl.textContent = "";
  }

  close() {
    window.close();
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    try {
      new SummarysePopup();
    } catch (error) {
      console.error("Failed to initialize:", error);
      document.body.innerHTML = `<div style="padding: 20px; color: #d32f2f;">Error: ${error.message}</div>`;
    }
  });
} else {
  try {
    new SummarysePopup();
  } catch (error) {
    console.error("Failed to initialize:", error);
    document.body.innerHTML = `<div style="padding: 20px; color: #d32f2f;">Error: ${error.message}</div>`;
  }
}
