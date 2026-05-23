let summaryseWidget = null;

function isExtensionContextValid() {
  try {
    chrome.runtime.getURL("");
    return true;
  } catch (e) {
    return false;
  }
}

class SummaryseWidget {
  constructor(text) {
    this.text = text;
    this.widget = null;
    this.currentSummary = "";
    this.modelLoaded = false;
    this.isLoading = false;
    this.summaryStyle = "bullets";

    // Large text handling
    this.isLargeText = isLargeText(text);
    this.chunks = [];
    this.chunkSummaries = [];
    this.currentChunkIndex = 0;
    this.modalOpen = false;
    this.finalized = false;

    this.createWidget();
    this.setupMessageListener();
    this.applyDarkModeIfNeeded();

    // Defer initialization to next frame to avoid blocking
    setTimeout(() => this.initialize(), 0);
  }

  applyDarkModeIfNeeded() {
    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      this.widget.classList.add("dark-mode");
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "PROGRESS" || message.type === "TOKEN" || message.type === "READY" || message.type === "COMPLETE" || message.type === "ERROR") {
        console.log(`[summaryse-widget] Message received:`, message.type);
        this.handleBackgroundMessage(message);
      }
    });
  }

  updateHeaderSubtitle(text) {
    const subtitle = this.widget.querySelector("#subtitle");
    if (subtitle) {
      subtitle.textContent = text;
    }
  }

  handleBackgroundMessage(message) {
    const { type, text, token, summary, error, chunkIndex, totalChunks, isFinalSummary } = message;

    if (type === "PROGRESS") {
      console.log(`[summaryse-widget] Progress: ${text}`);
      this.updateLoadingText(text);
      this.updateHeaderSubtitle("Downloading model...");
    } else if (type === "TOKEN") {
      if (this.isLargeText && !isFinalSummary) {
        // Streaming chunk summary
        if (!this.chunkSummaries[chunkIndex]) {
          this.chunkSummaries[chunkIndex] = "";
        }
        this.chunkSummaries[chunkIndex] += token;
        this.updateChunkDisplay(chunkIndex);
        this.updateHeaderSubtitle("Generating...");
      } else if (!isFinalSummary) {
        // Single summary (not large text, not final)
        this.currentSummary += token;
        this.updateSummaryDisplay();
        this.updateHeaderSubtitle("Generating...");
      } else {
        // Final summary - just accumulate, don't display yet
        this.currentSummary += token;
        this.updateHeaderSubtitle("Finalizing...");
      }
    } else if (type === "READY") {
      this.modelLoaded = true;
      console.log("✅ [summaryse-widget] Model loaded, isLargeText=" + this.isLargeText + ", chunks=" + (this.chunks ? this.chunks.length : "undefined"));
      this.updateHeaderSubtitle("Ready. Offline.");
      chrome.storage.local.set({ summaryse_model_ready: true });
      this.startSummarization();
    } else if (type === "COMPLETE") {
      if (this.isLargeText && !isFinalSummary) {
        // Chunk summary complete
        this.chunkSummaries[chunkIndex] = summary;
        this.updateChunkDisplay(chunkIndex);
        this.updateHeaderSubtitle(`Chunk ${chunkIndex + 1}/${totalChunks}`);
        // Process next chunk
        this.processNextChunk();
      } else {
        // Final summary complete
        this.currentSummary = summary;
        this.updateHeaderSubtitle("Generated instantly");
        this.showSummary();
      }
    } else if (type === "ERROR") {
      console.error(`[summaryse-widget] Error: ${error}`);
      this.updateHeaderSubtitle("Error occurred");
      this.showError(error);
    }
  }

  async initialize() {
    try {
      console.log("[summaryse-widget] Initializing widget...");

      // If large text, chunk it immediately (no confirmation dialog)
      if (this.isLargeText) {
        console.log("[summaryse-widget] Large text detected, chunking...");
        // Do chunking in a deferred task to not block UI
        setTimeout(() => {
          this.chunks = splitIntoChunks(this.text);
          console.log(`[summaryse-widget] ✓ Split text into ${this.chunks.length} chunks`);
          this.proceedWithInit();
        }, 10);
        return;
      }

      // Not large text, proceed normally
      this.proceedWithInit();
    } catch (error) {
      console.error("[summaryse-widget] Initialization error:", error);
      this.showError(error.message);
    }
  }

  async proceedWithInit() {
    console.log("[summaryse-widget] Waking up service worker...");
    // Wake up background service worker if it's sleeping
    await this.wakeUpServiceWorker();
    console.log("[summaryse-widget] ✓ Service worker awake");

    console.log("[summaryse-widget] Checking model status...");
    // Check if model was already loaded before
    const modelReady = await new Promise((resolve) => {
      chrome.storage.local.get("summaryse_model_ready", (data) => {
        console.log("[summaryse-widget] Model ready flag:", data.summaryse_model_ready);
        resolve(data.summaryse_model_ready === true);
      });
    });

    if (modelReady) {
      console.log("[summaryse-widget] ✓ Model was previously loaded, skipping setup screen");
      this.modelLoaded = true;
      this.updateHeaderSubtitle("Ready. Offline.");
      console.log("[summaryse-widget] Calling startSummarization...");
      this.startSummarization();
      return;
    }

    console.log("[summaryse-widget] First time setup - showing loading screen and requesting model load");
    // First time - show loading
    this.showLoading("Setting up on first use...\nDownloading AI model (1.4 GB, ~2-3 min)");

    // Send LOAD_MODEL request to background
    chrome.runtime.sendMessage(
      { type: "LOAD_MODEL" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[summaryse-widget] Failed to send LOAD_MODEL:", chrome.runtime.lastError);
          this.showError("Failed to initialize model: " + chrome.runtime.lastError.message);
        } else {
          console.log("[summaryse-widget] ✓ LOAD_MODEL sent successfully");
        }
      }
    );
  }

  wakeUpServiceWorker() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "PING" },
        (response) => {
          console.log("[summaryse-widget] Service worker ping response:", response);
          resolve();
        }
      );
    });
  }

  startSummarization() {
    console.log(`[summaryse-widget] Starting summarization: isLargeText=${this.isLargeText}, style=${this.summaryStyle}, chunks=${this.chunks ? this.chunks.length : 0}`);
    this.currentSummary = "";

    if (this.isLargeText && this.chunks && this.chunks.length > 0) {
      // Process chunks sequentially - create all cards upfront with skeleton (optimistic UI)
      console.log(`[summaryse-widget] Processing ${this.chunks.length} chunks`);
      this.currentChunkIndex = 0;
      this.chunkSummaries = new Array(this.chunks.length);

      // Create all chunk cards with skeleton upfront
      const content = this.widget.querySelector(".summaryse-content");
      content.innerHTML = "";
      for (let i = 0; i < this.chunks.length; i++) {
        const chunkCard = document.createElement("div");
        chunkCard.id = `chunk-${i}`;
        chunkCard.className = "chunk-card";
        chunkCard.innerHTML = `
          <div class="chunk-content">
            <div class="summaryse-skeleton">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
            </div>
          </div>
        `;
        content.appendChild(chunkCard);
      }

      this.updateHeaderSubtitle("Generating...");
      this.processNextChunk();
    } else {
      // Single text summarization
      console.log("[summaryse-widget] Processing as single summary (not large text)");
      this.showLoading("Generating summary...");
      chrome.runtime.sendMessage(
        { type: "SUMMARIZE", text: this.text, style: this.summaryStyle },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("[summaryse-widget] Failed to send SUMMARIZE:", chrome.runtime.lastError);
            this.showError("Failed to send summarization request: " + chrome.runtime.lastError.message);
          } else {
            console.log("[summaryse-widget] SUMMARIZE sent successfully");
          }
        }
      );
    }
  }

  processNextChunk() {
    console.log(`[summaryse-widget] processNextChunk: index=${this.currentChunkIndex}, total=${this.chunks.length}, isLargeText=${this.isLargeText}`);

    if (this.currentChunkIndex >= this.chunks.length) {
      // All chunks done, merge and create final summary
      console.log("[summaryse-widget] All chunks processed, merging...");
      this.mergeChunks();
      return;
    }

    if (!this.chunks || this.chunks.length === 0) {
      console.error("[summaryse-widget] Chunks not initialized!");
      this.showError("Internal error: chunks not initialized");
      return;
    }

    const chunk = this.chunks[this.currentChunkIndex];
    console.log(`[summaryse-widget] Processing chunk ${this.currentChunkIndex + 1}/${this.chunks.length} (${chunk.text.length} chars)`);

    chrome.runtime.sendMessage(
      {
        type: "SUMMARIZE",
        text: chunk.text,
        style: this.summaryStyle,
        chunkIndex: this.currentChunkIndex,
        totalChunks: this.chunks.length,
        isChunk: true
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[summaryse-widget] Failed to send SUMMARIZE:", chrome.runtime.lastError);
          this.showError("Failed to send summarization request: " + chrome.runtime.lastError.message);
        } else {
          console.log("[summaryse-widget] SUMMARIZE sent for chunk", this.currentChunkIndex);
          this.currentChunkIndex++;
        }
      }
    );
  }

  mergeChunks() {
    // Mark as finalized - will hide chunk cards in final display
    this.finalized = true;

    // Combine all chunk summaries
    const combined = this.chunkSummaries.join('\n\n');

    // Show small "Synthesising" card at the end (keep all chunks visible)
    this.updateHeaderSubtitle("Synthesizing...");
    const content = this.widget.querySelector(".summaryse-content");

    // Create a small synthesizing card
    const synthesizingCard = document.createElement("div");
    synthesizingCard.className = "synthesizing-card";
    synthesizingCard.id = "synthesizing-card";
    synthesizingCard.innerHTML = `
      <div class="synth-container">
        <div class="loading-icon">✨</div>
        <div>
          <p class="synth-title">Synthesizing...</p>
          <p class="synth-subtitle">Creating final summary</p>
        </div>
      </div>
    `;
    content.appendChild(synthesizingCard);

    // Send combined summary for final refinement
    chrome.runtime.sendMessage(
      {
        type: "SUMMARIZE",
        text: combined,
        style: this.summaryStyle,
        isFinalSummary: true
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[summaryse-widget] Failed to send final SUMMARIZE:", chrome.runtime.lastError);
          this.showError("Failed to finalize summary: " + chrome.runtime.lastError.message);
        }
      }
    );
  }

  createWidget() {
    // Add breathing backdrop to body
    document.body.classList.add("summaryse-backdrop-added");

    // Inject styles
    const styleId = "summaryse-widget-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        /* CSS Variables - Material Design 3 Expressive - Dark Theme */
        :root {
          /* Primary Color Palette - Dark Slate */
          --color-primary: #1E293B;
          --color-primary-200: #475569;
          --color-primary-300: #64748B;
          --color-primary-600: #0F172A;
          --color-primary-hover: #0F172A;
          --color-primary-active: #020617;

          /* Secondary & Accent */
          --color-secondary: #334155;
          --color-secondary-hover: #1E293B;
          --color-accent: #F59E0B;

          /* Semantic Colors */
          --color-success: #1ccb5c;
          --color-warning: #fba005;
          --color-error: #f43f3f;
          --color-info: #3681fb;

          /* Neutral Palette */
          --color-bg: #FFFFFF;
          --color-surface: #F8F9FA;
          --color-surface-bright: #FFFFFF;
          --color-border: #E5E7EB;
          --color-border-subtle: #F3F4F6;

          /* Typography */
          --color-text-primary: #1F2937;
          --color-text-secondary: #6B7280;
          --color-text-tertiary: #9CA3AF;

          /* Shadow Hierarchy */
          --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
          --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
          --shadow-elevation-1: 0 2px 8px rgba(0, 0, 0, 0.08);
          --shadow-elevation-2: 0 8px 24px rgba(0, 0, 0, 0.12);
          --shadow-elevation-3: 0 12px 32px rgba(0, 0, 0, 0.16);

          /* Spacing Scale */
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 12px;
          --spacing-lg: 16px;
          --spacing-xl: 20px;
          --spacing-2xl: 24px;
          --spacing-3xl: 32px;
          --spacing-4xl: 40px;

          /* Border Radius */
          --radius-sm: 4px;
          --radius-md: 6px;
          --radius-lg: 8px;
          --radius-xl: 12px;
          --radius-2xl: 16px;
          --radius-full: 9999px;

          /* Animation */
          --duration-fast: 150ms;
          --duration-normal: 300ms;
          --duration-slow: 500ms;
          --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
          --ease-in: cubic-bezier(0.4, 0, 1, 1);
          --ease-expressive: cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Teal breathing gradient - expressive, flowing animation */
        @keyframes tealonFlow {
          0% {
            background: linear-gradient(225deg, rgba(30, 41, 59, 0.06) 0%, rgba(163, 233, 230, 0.04) 20%, transparent 45%);
          }
          25% {
            background: linear-gradient(225deg, rgba(30, 41, 59, 0.08) 0%, rgba(163, 233, 230, 0.06) 20%, transparent 45%);
          }
          50% {
            background: linear-gradient(225deg, rgba(30, 41, 59, 0.05) 0%, rgba(163, 233, 230, 0.03) 20%, transparent 45%);
          }
          75% {
            background: linear-gradient(225deg, rgba(30, 41, 59, 0.08) 0%, rgba(163, 233, 230, 0.05) 20%, transparent 45%);
          }
          100% {
            background: linear-gradient(225deg, rgba(30, 41, 59, 0.06) 0%, rgba(163, 233, 230, 0.04) 20%, transparent 45%);
          }
        }

        body.summaryse-backdrop-added {
          position: relative;
        }

        body.summaryse-backdrop-added::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 100vh;
          background:
            linear-gradient(225deg, rgba(30, 41, 59, 0.06) 0%, rgba(163, 233, 230, 0.03) 18%, transparent 45%),
            radial-gradient(ellipse 30% 35% at 100% 0%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.85) 35%);
          background-blend-mode: screen;
          animation: tealonFlow 10s cubic-bezier(0.4, 0.0, 0.2, 1.0) infinite;
          pointer-events: none;
          z-index: -1;
        }

        .summaryse-widget {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 520px;
          min-height: auto;
          max-height: 100vh;
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          z-index: 999999;
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow: visible;
          gap: 16px;
          pointer-events: none;
        }

        .summaryse-widget > * {
          pointer-events: auto;
        }

        @keyframes slideInWidget {
          0% {
            transform: translateX(60px) scale(0.97);
            opacity: 0;
            filter: blur(8px);
          }
          60% {
            filter: blur(0);
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
            filter: blur(0);
          }
        }

        .summaryse-header {
          position: relative;
          padding: var(--spacing-lg) var(--spacing-xl);
          border: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          background: var(--color-surface-bright);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-elevation-1);
          animation: slideInWidget 0.4s var(--ease-expressive);
          overflow: hidden;
          font-family: 'Space Grotesk', sans-serif;
          transition: all var(--duration-normal) var(--ease-out);
        }

        .summaryse-header:hover {
          box-shadow: var(--shadow-elevation-2);
          border-color: rgba(30, 41, 59, 0.2);
        }

        /* Subtle accent line on header */
        .summaryse-header::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--color-primary), transparent);
          opacity: 0.6;
          pointer-events: none;
        }

        .summaryse-header > * {
          position: relative;
          z-index: 1;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .header-center {
          display: flex;
          align-items: center;
          margin: 0 8px;
        }

        .style-selector {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .style-selector:hover {
          border-color: var(--color-primary);
          background: rgba(30, 41, 59, 0.04);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .style-selector:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1);
        }

        .style-selector option {
          background: #FFFFFF;
          color: var(--color-text-primary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
        }

        .summaryse-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: -0.5px;
          font-family: 'Space Grotesk', sans-serif;
        }

        .header-subtitle {
          margin: 0;
          font-size: 11px;
          color: var(--color-text-secondary);
          font-weight: 500;
          letter-spacing: 0.3px;
          transition: color var(--duration-normal) var(--ease-out);
          font-family: 'Inter', sans-serif;
        }

        .header-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-secondary);
          padding: 6px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--duration-fast) var(--ease-out);
          border-radius: var(--radius-md);
          font-size: 18px;
        }

        .header-icon-btn:hover {
          background: rgba(30, 41, 59, 0.1);
          color: var(--color-primary);
          transform: translateY(-3px) scale(1.1);
          box-shadow: var(--shadow-sm);
        }

        .header-icon-btn:active {
          background: rgba(30, 41, 59, 0.15);
          transform: translateY(-1px) scale(0.98);
        }

        .summaryse-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--color-text-secondary);
          padding: 6px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--duration-fast) var(--ease-out);
          border-radius: var(--radius-md);
        }

        .summaryse-close:hover {
          background: rgba(30, 41, 59, 0.1);
          color: var(--color-primary);
          transform: rotate(90deg) scale(1.15);
        }

        .summaryse-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          overflow-y: auto;
          max-height: calc(100vh - 80px);
          padding-right: 4px;
          background: transparent;
        }

        /* Skeleton — Material Design 3 Expressive shimmer animation */
        .summaryse-skeleton {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          animation: skeletonFlow 2.4s ease-in-out infinite;
        }

        @keyframes skeletonFlow {
          0%, 100% {
            opacity: 0.6;
            transform: translateX(0);
          }
          50% {
            opacity: 1;
            transform: translateX(2px);
          }
        }

        .skeleton-line {
          height: 12px;
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-full);
          background: linear-gradient(
            90deg,
            var(--color-border) 0%,
            rgba(30, 41, 59, 0.1) 50%,
            var(--color-border) 100%
          );
          background-size: 200% 100%;
          animation: skeletonBase 2s ease-in-out infinite;
        }

        @keyframes skeletonBase {
          0%, 100% { background-color: var(--color-border); }
          50% { background-color: rgba(30, 41, 59, 0.15); }
        }

        /* Shimmer effect — teal-tinted */
        .skeleton-line::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(30, 41, 59, 0.3) 30%,
            rgba(30, 41, 59, 0.6) 50%,
            rgba(30, 41, 59, 0.3) 70%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: background-position, opacity;
        }

        .skeleton-line:nth-child(1) { width: 100%; }
        .skeleton-line:nth-child(2) { width: 92%; }
        .skeleton-line:nth-child(3) { width: 78%; }

        .skeleton-line:nth-child(1)::after { animation-delay: 0s; }
        .skeleton-line:nth-child(2)::after { animation-delay: 0.15s; }
        .skeleton-line:nth-child(3)::after { animation-delay: 0.3s; }

        @keyframes skeletonShimmer {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }


        .error-message {
          color: var(--color-error);
          padding: 12px 16px;
          background: var(--color-error-light);
          border-left: 4px solid var(--color-error);
          border-radius: var(--radius-lg);
          font-size: 13px;
          box-shadow: var(--shadow-xs);
          animation: cardRise 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .error-message strong {
          font-weight: 600;
          color: var(--color-error);
        }

        .summaryse-content::-webkit-scrollbar {
          display: none;
        }

        .summaryse-content {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .bullet-point-streaming {
          margin-bottom: var(--spacing-lg);
          padding-left: 0;
          line-height: 1.8;
          color: var(--color-text-primary);
          opacity: 1;
          font-size: 14px;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }

        /* Streaming content container — card styling without animation delay */
        .summaryse-content:has(.bullet-point-streaming) {
          background: #FFFFFF;
          padding: var(--spacing-xl);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-elevation-1);
          margin-bottom: var(--spacing-lg);
          position: relative;
          contain: layout style paint;
        }

        .summaryse-content:has(.bullet-point-streaming)::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-primary), var(--color-primary-200), transparent);
          opacity: 0.6;
          pointer-events: none;
          z-index: 1;
        }

        .bullet-point {
          margin-bottom: var(--spacing-lg);
          padding: 0;
          background: transparent;
          border-radius: 0;
          line-height: 1.6;
          color: var(--color-text-primary);
          animation: fadeInBullet 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
          font-size: 14px;
          font-weight: 400;
          position: relative;
          z-index: 1;
          transition: all var(--duration-normal) var(--ease-out);
        }

        .bullet-point:nth-child(1) { animation-delay: 0.05s; }
        .bullet-point:nth-child(2) { animation-delay: 0.1s; }
        .bullet-point:nth-child(3) { animation-delay: 0.15s; }
        .bullet-point:nth-child(4) { animation-delay: 0.2s; }
        .bullet-point:nth-child(5) { animation-delay: 0.25s; }
        .bullet-point:nth-child(6) { animation-delay: 0.3s; }
        .bullet-point:nth-child(7) { animation-delay: 0.35s; }

        @keyframes fadeInBullet {
          0% {
            opacity: 0;
            transform: translateY(8px);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .bullet-point:last-child {
          margin-bottom: 0;
        }

        .bullet-point strong,
        .bullet-point-streaming strong {
          color: var(--color-primary);
          font-weight: 600;
        }

        .summary-text {
          line-height: 1.6;
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }

        .summary-text strong {
          color: var(--color-primary);
          font-weight: 600;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 32px 20px;
          text-align: center;
        }

        .loading-icon {
          font-size: 48px;
          display: inline-block;
          animation: iconBreathe 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          filter: drop-shadow(0 4px 8px rgba(30, 41, 59, 0.2));
        }

        @keyframes iconBreathe {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.1) rotate(4deg);
            opacity: 1;
          }
        }

        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .loading-container p {
          margin: 4px 0;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .size-note {
          font-size: 12px;
          color: var(--color-text-tertiary);
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--color-border);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin: 12px 0;
          position: relative;
          box-shadow: var(--shadow-xs);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--color-primary) 0%,
            var(--color-primary-60) 50%,
            var(--color-primary) 100%
          );
          background-size: 200% 100%;
          width: 0%;
          border-radius: var(--radius-full);
          transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          animation: progressFlow 2.5s linear infinite;
          box-shadow: 0 0 8px rgba(30, 41, 59, 0.3);
        }

        @keyframes progressFlow {
          0%   { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }

        .progress-text {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-primary);
          letter-spacing: 0.2px;
        }

        .tips {
          background: rgba(30, 41, 59, 0.05);
          border-left: 3px solid var(--color-primary);
          padding: 10px 14px;
          border-radius: var(--radius-lg);
          margin-top: 8px;
          text-align: left;
        }

        .tips p {
          margin: 4px 0;
          font-size: 12px;
          color: var(--color-primary);
          font-weight: 500;
        }

        .summary-stats {
          margin: 0;
          padding: 0;
          border: none;
          font-size: 12px;
          color: var(--color-text-secondary);
          display: flex;
          flex-direction: column;
          gap: 6px;
          line-height: 1.6;
          font-weight: 500;
        }

        .stat-line {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        /* Cards — Material Design 3 Expressive: Bold, elevated, confident */

        .chunk-card,
        .final-summary-card,
        .summary-card,
        .stats-card {
          position: relative;
          background: var(--color-surface-bright);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-elevation-1);
          transition: all var(--duration-normal) var(--ease-out);
          overflow: hidden;
          animation: cardRise var(--duration-slow) var(--ease-expressive) both;
        }

        /* Clean design: no pseudo-elements (except chunk-card which has a gradient line) */
        .final-summary-card::before,
        .summary-card::before,
        .stats-card::before {
          display: none;
        }

        .chunk-card::before {
          display: none;
        }

        .chunk-card,
        .final-summary-card,
        .summary-card {
          padding: var(--spacing-xl);
          font-size: var(--spacing-base, 14px);
          line-height: 1.7;
          color: var(--color-text-primary);
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* Premium chunk card styling with subtle gradient depth */
        .chunk-card {
          background: #FFFFFF;
          position: relative;
          overflow: hidden;
        }

        .chunk-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-primary), var(--color-primary-200), transparent);
          opacity: 0.6;
          pointer-events: none;
        }

        .chunk-card::after {
          display: none;
        }

        .stats-card {
          padding: var(--spacing-lg);
          font-size: 12px;
        }

        /* Hover — expressive elevation and lift */
        .chunk-card:hover,
        .final-summary-card:hover,
        .summary-card:hover {
          transform: translateY(-8px);
          border-color: rgba(30, 41, 59, 0.3);
          box-shadow: var(--shadow-elevation-3);
        }


        .stats-card:hover {
          transform: translateY(-4px);
          border-color: rgba(30, 41, 59, 0.1);
          box-shadow: var(--shadow-elevation-2);
        }

        /* Final summary — premium flagship card with subtle gradient accent */
        .final-summary-card {
          background: var(--color-surface-bright);
          position: relative;
          overflow: hidden;
        }

        .final-summary-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-primary), var(--color-primary-200), transparent);
          opacity: 0.5;
          pointer-events: none;
        }

        .final-summary-card::after {
          display: none;
        }

        /* Enhanced card entrance - Material Design 3 Expressive with depth */
        @keyframes cardRise {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.92);
            filter: blur(4px);
          }
          60% {
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }


        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
          to {
            opacity: 0;
            transform: translateX(-40px) scale(0.96);
            filter: blur(4px);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.96);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
        }

        .slide-out-left {
          animation: slideOutLeft 0.45s cubic-bezier(0.55, 0, 0.35, 1) forwards !important;
        }

        .slide-in-right {
          animation: slideInRight 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
        }

        .chunk-header {
          display: none;
        }

        .chunk-content {
          position: relative;
          z-index: 1;
          font-size: 14px;
          line-height: 1.8;
          color: var(--color-text-primary);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        /* Bold labels inside chunks — clean, bold, teal */
        .chunk-content strong {
          color: var(--color-primary);
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: -0.3px;
        }

        /* Enhanced hover effect on bullet point labels */
        .bullet-point:hover strong {
          opacity: 0.8;
        }

        /* Synthesizing — expressive loading state with gradient accent */
        .synthesizing-card {
          position: relative;
          background: var(--color-surface-bright);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md) var(--spacing-lg);
          box-shadow: var(--shadow-elevation-1);
          animation: cardRise var(--duration-slow) var(--ease-expressive) both;
          overflow: hidden;
          transition: all var(--duration-normal) var(--ease-out);
        }

        .synthesizing-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-primary), var(--color-primary-200), transparent);
          opacity: 0.6;
          pointer-events: none;
          z-index: 1;
        }

        .synth-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          position: relative;
          z-index: 2;
        }

        .synth-title {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          font-family: 'Space Grotesk', sans-serif;
        }

        .synth-subtitle {
          margin: 0;
          font-size: 12px;
          color: var(--color-text-secondary);
          font-weight: 400;
          font-family: 'Inter', sans-serif;
        }

        .final-summary-header {
          display: none;
        }

        .final-summary-title {
          display: none;
        }

        .expand-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 6px;
          color: var(--color-text-secondary);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: var(--radius-sm);
        }

        .expand-btn:hover {
          color: var(--color-primary);
          background: rgba(30, 41, 59, 0.08);
          transform: scale(1.15);
        }

        .final-summary-content {
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-text-primary);
        }

        /* Modal */
        .modal-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000000;
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-overlay.active {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: #FFFFFF;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
          padding: 24px;
          position: relative;
          animation: modalScaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes modalScaleIn {
          0% {
            transform: scale(0.95) translateY(10px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--color-border);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--color-text-secondary);
          padding: 4px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: var(--radius-md);
        }

        .modal-close:hover {
          color: var(--color-primary);
          background: rgba(30, 41, 59, 0.08);
          transform: rotate(90deg) scale(1.1);
        }

        .modal-body {
          font-size: 14px;
          line-height: 1.7;
          color: var(--color-text-primary);
        }

        .modal-body strong {
          color: var(--color-primary);
          font-weight: 600;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Dark mode — Teal accent system — DISABLED FOR LIGHT MODE TESTING */
        @media (prefers-color-scheme: never-dark) {
          :root {
            --color-bg: #0F172A;
            --color-surface: #1E293B;
            --color-border: #334155;
            --color-text-primary: #F1F5F9;
            --color-text-secondary: #94A3B8;
            --color-text-tertiary: #64748B;
          }

          .summaryse-header {
            background: #1E293B;
            border: 1px solid #334155;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          .summaryse-header::before {
            display: none;
          }

          .summaryse-header h3 {
            color: rgba(30, 41, 59, 0.9);
          }

          .header-subtitle {
            color: var(--color-text-secondary);
          }

          .bullet-point-streaming,
          .bullet-point {
            color: var(--color-text-primary);
          }

          .bullet-point-streaming strong,
          .bullet-point strong {
            color: rgba(163, 233, 230, 0.95);
          }

          .summary-stats {
            color: var(--color-text-secondary);
          }

          .loading-container h3 {
            color: var(--color-text-primary);
          }

          .loading-container p {
            color: var(--color-text-secondary);
          }

          .size-note {
            color: var(--color-text-tertiary);
          }

          .progress-bar {
            background: rgba(30, 41, 59, 0.1);
          }

          .progress-fill {
            background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-60) 50%, var(--color-primary) 100%);
          }

          .progress-text {
            color: rgba(163, 233, 230, 0.95);
          }

          .tips {
            background: rgba(30, 41, 59, 0.08);
            border-left-color: var(--color-primary);
            color: var(--color-primary-90);
          }

          .tips p {
            color: var(--color-primary-90);
          }

          .style-selector {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid var(--color-border);
            color: var(--color-text-primary);
          }

          .style-selector:hover {
            border-color: var(--color-primary);
            background: rgba(30, 41, 59, 0.05);
          }

          .style-selector:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.15);
          }

          .style-selector option {
            background: #1E293B;
            color: var(--color-text-primary);
          }

          .header-icon-btn {
            color: var(--color-text-secondary);
          }

          .header-icon-btn:hover {
            background: rgba(30, 41, 59, 0.1);
            color: var(--color-primary);
          }

          .header-icon-btn:active {
            background: rgba(30, 41, 59, 0.15);
          }

          .summaryse-close {
            color: var(--color-text-secondary);
          }

          .summaryse-close:hover {
            background: rgba(30, 41, 59, 0.1);
            color: var(--color-primary);
          }

          .error-message {
            background: rgba(239, 68, 68, 0.1);
            border-left-color: var(--color-error);
            color: rgba(239, 68, 68, 0.9);
          }

          .error-message strong {
            color: var(--color-error);
          }

          .skeleton-line {
            background: linear-gradient(90deg, rgba(30, 41, 59, 0.15) 0%, rgba(30, 41, 59, 0.2) 50%, rgba(30, 41, 59, 0.15) 100%);
          }

          .skeleton-line::after {
            background: linear-gradient(90deg, transparent 0%, rgba(30, 41, 59, 0.4) 30%, rgba(30, 41, 59, 0.7) 50%, rgba(30, 41, 59, 0.4) 70%, transparent 100%);
          }

          .summary-text {
            color: var(--color-text-primary);
          }

          .summary-text strong {
            color: var(--color-primary-90);
          }

          .chunk-card,
          .final-summary-card,
          .summary-card,
          .stats-card {
            background: #1E293B;
            border: 1px solid #334155;
            color: var(--color-text-primary);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2);
          }

          .chunk-card::before,
          .final-summary-card::before,
          .summary-card::before,
          .stats-card::before {
            display: none;
          }

          .chunk-card:hover,
          .final-summary-card:hover,
          .summary-card:hover {
            transform: translateY(-6px);
            border-color: #475569;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.2);
          }

          .chunk-content {
            color: var(--color-text-primary);
          }

          .final-summary-card::after {
            display: none;
          }

          .synthesizing-card {
            background: #1E293B;
            border: 1px solid #334155;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2);
          }

          .synthesizing-card::before {
            display: none;
          }

          .expand-btn {
            color: var(--color-text-secondary);
          }

          .expand-btn:hover {
            color: var(--color-primary);
            background: rgba(30, 41, 59, 0.1);
          }

          .final-summary-content {
            color: var(--color-text-primary);
          }

          .modal-content {
            background: #1E293B;
            box-shadow: 0 20px 32px rgba(0, 0, 0, 0.7);
            border: 1px solid var(--color-border);
          }

          .modal-header {
            border-bottom-color: var(--color-border);
          }

          .modal-title {
            color: var(--color-primary);
          }

          .modal-body {
            color: var(--color-text-primary);
          }

          .modal-body strong {
            color: var(--color-primary-90);
          }

          .modal-close {
            color: var(--color-text-secondary);
          }

          .modal-close:hover {
            color: var(--color-primary);
            background: rgba(30, 41, 59, 0.1);
          }
        }

        /* Reduced motion — respect user preference */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .skeleton-line::after {
            animation: skeletonPulseReduced 2s ease-in-out infinite !important;
            background: rgba(30, 41, 59, 0.2) !important;
            background-size: 100% 100% !important;
          }

          @keyframes skeletonPulseReduced {
            0%, 100% { opacity: 0.5; }
            50%      { opacity: 1; }
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Create widget HTML
    this.widget = document.createElement("div");
    this.widget.className = "summaryse-widget";
    this.widget.innerHTML = `
      <div class="summaryse-header">
        <div class="header-left">
          <h3>🔒 Summaryse</h3>
          <p class="header-subtitle" id="subtitle">Private. Offline.</p>
        </div>
        <div class="header-center">
          <select class="style-selector" id="styleSelector">
            <option value="bullets">Bullets</option>
            <option value="tldr">TL;DR</option>
            <option value="paragraph">Paragraph</option>
            <option value="takeaways">Takeaways</option>
          </select>
        </div>
        <div class="header-right">
          <button class="header-icon-btn copy-btn" title="Copy Summary" style="display: none;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </button>
          <button class="header-icon-btn new-btn" title="Regenerate" style="display: none;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
            </svg>
          </button>
          <button class="summaryse-close">×</button>
        </div>
      </div>
      <div class="summaryse-content"></div>
    `;

    document.body.appendChild(this.widget);

    // Attach event listeners
    this.widget.querySelector(".summaryse-close").addEventListener("click", () => this.close());
    this.widget.querySelector(".copy-btn").addEventListener("click", () => this.copy());
    this.widget.querySelector(".new-btn").addEventListener("click", () => this.reset());
    this.widget.querySelector("#styleSelector").addEventListener("change", (e) => {
      this.summaryStyle = e.target.value;
      this.reset();
    });
  }

  showLoading(message = "Loading...") {
    const content = this.widget.querySelector(".summaryse-content");
    this.isLoading = true;

    // Check if first use (model not loaded)
    const isFirstUse = !this.modelLoaded;

    if (isFirstUse) {
      content.innerHTML = `
        <div class="loading-container">
          <div class="loading-icon">🔄</div>
          <h3>Setting up on first use...</h3>
          <p>Downloading AI model</p>
          <p class="size-note">(1.4 GB, ~2-3 min)</p>
          <div class="progress-bar">
            <div class="progress-fill" id="progress"></div>
          </div>
          <p class="progress-text" id="progress-text">0%</p>
          <div class="tips">
            <p>✓ One-time setup only</p>
            <p>✓ Future summaries: instant</p>
          </div>
        </div>
      `;
    } else {
      // Model already loaded - clear content, chunk cards will populate with skeleton
      content.innerHTML = "";
    }
  }

  updateLoadingText(message) {
    // Update progress bar from offscreen.js messages
    console.log("[summaryse-widget]", message);
  }

  updateSummaryDisplay() {
    const content = this.widget.querySelector(".summaryse-content");
    content.innerHTML = this.formatSummary(this.currentSummary, true);
    this.showSummaryActions();
  }

  showSummary() {
    this.isLoading = false;
    const content = this.widget.querySelector(".summaryse-content");

    // Calculate stats
    const wordCount = this.text.split(/\s+/).length;
    const summaryWordCount = this.currentSummary.split(/\s+/).length;
    const reduction = Math.round(((wordCount - summaryWordCount) / wordCount) * 100);

    if (this.isLargeText && !this.finalized) {
      // Show chunk cards + final summary card (during chunking)
      let html = "";

      // Add all chunk cards
      this.chunkSummaries.forEach((summary, idx) => {
        html += `
          <div class="chunk-card">
            <div class="chunk-header">${idx + 1}️⃣ Chunk ${idx + 1}</div>
            <div class="chunk-content">${this.formatSummary(summary, false)}</div>
          </div>
        `;
      });

      // Add final summary card
      html += `
        <div class="final-summary-card">
          <div class="final-summary-content">
            ${this.formatSummary(this.currentSummary, false)}
          </div>
          <button class="expand-btn" title="Expand" data-expanded="false">↗</button>
        </div>
        <div class="stats-card">
          <div class="summary-stats">
            <span>✓ ${wordCount} words → ${summaryWordCount} words (${reduction}% shorter)</span>
            <span>Generated from ${this.chunks.length} chunks | Offline</span>
          </div>
        </div>
      `;

      content.innerHTML = html;

      // Attach expand button listener
      const expandBtn = content.querySelector(".expand-btn");
      expandBtn.addEventListener("click", () => this.openModal());
    } else if (this.isLargeText && this.finalized) {
      // Hide chunk cards and synthesizing card with animation, then show final card
      const chunkCards = content.querySelectorAll(".chunk-card");
      const synthesizingCard = content.querySelector("#synthesizing-card");

      // Animate chunk cards out to the left
      chunkCards.forEach(card => {
        card.classList.add("slide-out-left");
      });

      if (synthesizingCard) {
        synthesizingCard.classList.add("slide-out-left");
      }

      // After animation, replace content with final card
      setTimeout(() => {
        const html = `
          <div class="final-summary-card slide-in-right">
            <div class="final-summary-content">
              ${this.formatSummary(this.currentSummary, false)}
            </div>
            <button class="expand-btn" title="Expand" data-expanded="false">↗</button>
          </div>
          <div class="stats-card">
            <div class="summary-stats">
              <span>✓ ${wordCount} words → ${summaryWordCount} words (${reduction}% shorter)</span>
              <span>Generated from ${this.chunks.length} chunks | Offline</span>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Attach expand button listener
        const expandBtn = content.querySelector(".expand-btn");
        expandBtn.addEventListener("click", () => this.openModal());
      }, 300);
    } else {
      // Single summary display
      const html = `
        <div class="summary-card">
          ${this.formatSummary(this.currentSummary, false)}
        </div>
        <div class="stats-card">
          <div class="summary-stats">
            <span>✓ ${wordCount} words → ${summaryWordCount} words (${reduction}% shorter)</span>
            <span>Generated instantly | Offline</span>
          </div>
        </div>
      `;

      content.innerHTML = html;
    }

    this.showSummaryActions();
  }

  openModal() {
    // Create modal if it doesn't exist
    let modal = this.widget.querySelector(".modal-overlay");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "modal-overlay";
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Summary</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">${this.formatSummary(this.currentSummary, false)}</div>
        </div>
      `;

      this.widget.appendChild(modal);

      // Attach close button listener
      modal.querySelector(".modal-close").addEventListener("click", () => this.closeModal());
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    modal.classList.add("active");
    this.modalOpen = true;
  }

  closeModal() {
    const modal = this.widget.querySelector(".modal-overlay");
    if (modal) {
      modal.classList.remove("active");
      this.modalOpen = false;
    }
  }

  formatSummary(text, isStreaming = false) {
    const lines = text.split('\n').filter(line => line.trim());
    const bulletPattern = /^[•\-\*]\s*/;
    const markdownBoldPattern = /\*\*(.+?)\*\*/g;

    if (lines.some(line => bulletPattern.test(line))) {
      return lines.map(line => {
        const cleanedLine = line.replace(bulletPattern, '').trim();
        if (cleanedLine) {
          const formatted = this.formatMarkdown(cleanedLine);
          const animClass = isStreaming ? 'bullet-point-streaming' : 'bullet-point';
          return `<div class="${animClass}">${formatted}</div>`;
        }
        return '';
      }).join('');
    }

    return `<div class="summary-text">${this.formatMarkdown(text)}</div>`;
  }

  updateChunkDisplay(chunkIndex) {
    // Update existing chunk card with actual summary
    const content = this.widget.querySelector(".summaryse-content");
    const chunkCard = content.querySelector(`#chunk-${chunkIndex}`);

    if (chunkCard) {
      const contentDiv = chunkCard.querySelector(".chunk-content");
      const summary = this.chunkSummaries[chunkIndex] || "";
      if (summary) {
        contentDiv.innerHTML = this.formatSummary(summary, true);
      }
    }
  }

  formatMarkdown(text) {
    return this.escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  showSummaryActions() {
    this.widget.querySelector(".copy-btn").style.display = "flex";
    this.widget.querySelector(".new-btn").style.display = "flex";
  }

  hideSummaryActions() {
    this.widget.querySelector(".copy-btn").style.display = "none";
    this.widget.querySelector(".new-btn").style.display = "none";
  }

  showError(message) {
    this.isLoading = false;
    const content = this.widget.querySelector(".summaryse-content");
    content.innerHTML = `<div class="error-message"><strong>Error:</strong> ${this.escapeHtml(message)}</div>`;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  copy() {
    if (!this.currentSummary) {
      alert("No summary to copy");
      return;
    }

    navigator.clipboard
      .writeText(this.currentSummary)
      .then(() => {
        const btn = this.widget.querySelector(".copy-btn");
        const originalColor = btn.style.color;
        btn.style.color = "#10B981";
        btn.style.pointerEvents = "none";

        setTimeout(() => {
          btn.style.color = originalColor;
          btn.style.pointerEvents = "auto";
        }, 1500);
      })
      .catch((err) => {
        alert("Failed to copy: " + err.message);
      });
  }

  reset() {
    this.currentSummary = "";
    this.chunkSummaries = [];
    this.currentChunkIndex = 0;
    this.finalized = false;
    this.hideSummaryActions();
    this.closeModal();
    this.showLoading("Generating summary...");
    this.startSummarization();
  }

  close() {
    if (this.widget) {
      this.widget.remove();
      this.widget = null;
    }
    document.body.classList.remove("summaryse-backdrop-added");
    summaryseWidget = null;
  }
}


// Handle context menu summarize action
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === "SUMMARIZE_TEXT") {
      console.log("[summaryse-widget] Received context menu request");
      if (message.text && message.text.trim().length > 0) {
        summaryseWidget = new SummaryseWidget(message.text);
        sendResponse({ success: true });
      } else {
        console.error("No text provided");
        sendResponse({ success: false, error: "No text provided" });
      }
    }
  } catch (error) {
    console.error("[summaryse-widget] Message handler error:", error);
    sendResponse({ success: false, error: error.message });
  }
});

// Extract visible DOM text for auto-summarization
function getVisiblePageText() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let text = "";
  let node;

  while (node = walker.nextNode()) {
    // Skip text from hidden elements, scripts, styles, etc.
    const parent = node.parentElement;
    if (!parent) continue;

    const style = window.getComputedStyle(parent);
    // Skip if display: none or visibility: hidden
    if (style.display === "none" || style.visibility === "hidden") continue;

    // Skip script, style, noscript tags
    if (["SCRIPT", "STYLE", "NOSCRIPT", "META", "TITLE"].includes(parent.tagName)) continue;

    const textContent = node.textContent.trim();
    if (textContent) {
      text += textContent + " ";
    }
  }

  return text.trim();
}

// Keyboard shortcut for auto-summarization (Ctrl+Shift+S / Cmd+Shift+S)
document.addEventListener("keydown", (e) => {
  // Check for Ctrl+Shift+S (Windows/Linux) or Cmd+Shift+S (Mac)
  const isShortcut = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyS";

  if (isShortcut) {
    e.preventDefault();
    console.log("[summaryse] Keyboard shortcut triggered - extracting page text");

    const visibleText = getVisiblePageText();

    if (visibleText && visibleText.length > 0) {
      console.log(`[summaryse] Extracted ${visibleText.length} characters from page`);
      summaryseWidget = new SummaryseWidget(visibleText);
    } else {
      console.warn("[summaryse] No visible text found on page");
      alert("No visible text found to summarize");
    }
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (summaryseWidget) {
    summaryseWidget.close();
  }
});

// Show welcome screen on first install
function showWelcomeScreen() {
  chrome.storage.local.get("summaryse_welcome_shown", (data) => {
    if (!data.summaryse_welcome_shown) {
      const welcome = document.createElement("div");
      welcome.id = "summaryse-welcome";
      welcome.innerHTML = `
        <div class="summaryse-welcome-overlay">
          <div class="summaryse-welcome-card">
            <div class="welcome-header">
              <h2>✨ Summaryse Installed</h2>
              <button class="welcome-close">×</button>
            </div>
            <div class="welcome-content">
              <p class="welcome-title">Summarize text. Privately. Offline.</p>

              <div class="welcome-features">
                <div class="feature">
                  <span class="feature-icon">🔒</span>
                  <span>Your data never leaves your device</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">⚡</span>
                  <span>No login, no tracking</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">🌐</span>
                  <span>Works offline after setup</span>
                </div>
              </div>

              <div class="welcome-section">
                <h3>How to use:</h3>
                <ol>
                  <li>Select any text on a webpage</li>
                  <li>Click the summarize button</li>
                  <li>Get instant summaries</li>
                </ol>
              </div>

              <div class="welcome-section">
                <h3>First use:</h3>
                <p>AI model downloads on first use (~1.4 GB, takes 2-3 min)</p>
                <p class="note">✓ This only happens once. Future summaries will be instant.</p>
              </div>

              <button class="welcome-button">Got it!</button>
            </div>
          </div>
        </div>
      `;

      const style = document.createElement("style");
      style.textContent = `
        .summaryse-welcome-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000000;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: fadeIn var(--duration-normal) var(--ease-out);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .summaryse-welcome-card {
          background: var(--color-surface-bright);
          border-radius: var(--radius-2xl);
          max-width: 420px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: var(--shadow-elevation-2);
          animation: slideUp var(--duration-normal) var(--ease-expressive);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .welcome-header {
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.02) 0%, transparent 100%);
        }

        .welcome-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--color-primary);
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: -0.5px;
        }

        .welcome-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--color-text-secondary);
          padding: 6px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          transition: all var(--duration-fast) var(--ease-out);
          margin-right: -8px;
          font-weight: 300;
        }

        .welcome-close:hover {
          background: rgba(30, 41, 59, 0.1);
          color: var(--color-primary);
          transform: rotate(90deg) scale(1.1);
        }

        .welcome-content {
          padding: var(--spacing-xl);
        }

        .welcome-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0 0 var(--spacing-xl) 0;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: -0.3px;
        }

        .welcome-features {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .feature {
          display: flex;
          gap: var(--spacing-lg);
          align-items: flex-start;
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          padding: var(--spacing-md);
          background: rgba(30, 41, 59, 0.03);
          border-radius: var(--radius-md);
          transition: all var(--duration-normal) var(--ease-out);
        }

        .feature:hover {
          background: rgba(30, 41, 59, 0.06);
          transform: translateX(2px);
        }

        .feature-icon {
          font-size: 20px;
          flex-shrink: 0;
          line-height: 1.4;
        }

        .welcome-section {
          margin-bottom: var(--spacing-xl);
        }

        .welcome-section h3 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary);
          font-family: 'Space Grotesk', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
          opacity: 0.8;
        }

        .welcome-section p {
          margin: var(--spacing-sm) 0;
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          font-family: 'Inter', sans-serif;
        }

        .welcome-section ol {
          margin: var(--spacing-md) 0;
          padding-left: var(--spacing-xl);
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.7;
        }

        .welcome-section li {
          margin: var(--spacing-sm) 0;
          line-height: 1.7;
        }

        .note {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.08) 0%, rgba(30, 41, 59, 0.03) 100%);
          border-left: 4px solid var(--color-primary);
          padding: var(--spacing-md) var(--spacing-lg);
          border-radius: var(--radius-md);
          color: var(--color-primary);
          margin-top: var(--spacing-md);
          font-size: 12px;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
        }

        .welcome-button {
          width: 100%;
          padding: var(--spacing-lg);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--duration-normal) var(--ease-out);
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.3px;
          margin-top: var(--spacing-lg);
          box-shadow: var(--shadow-elevation-1);
        }

        .welcome-button:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-elevation-2);
          background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary-active) 100%);
        }

        .welcome-button:active {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        @media (prefers-color-scheme: never-dark) {
          .summaryse-welcome-card {
            background: #1E293B;
            border: 1px solid #334155;
          }

          .welcome-header {
            border-bottom-color: #334155;
          }

          .welcome-header h2 {
            color: var(--color-primary);
          }

          .welcome-close {
            color: #94A3B8;
          }

          .welcome-close:hover {
            background: rgba(30, 41, 59, 0.1);
            color: var(--color-primary);
          }

          .welcome-title {
            color: var(--color-text-primary);
          }

          .feature {
            color: #94A3B8;
          }

          .welcome-section h3 {
            color: var(--color-text-primary);
          }

          .welcome-section p,
          .welcome-section ol,
          .welcome-section li {
            color: #94A3B8;
          }

          .note {
            background: rgba(30, 41, 59, 0.1);
            border-left-color: var(--color-primary);
            color: var(--color-primary-90);
          }

          .welcome-button {
            background: var(--color-primary);
            color: #0F172A;
          }

          .welcome-button:hover {
            background: var(--color-primary-60);
            box-shadow: var(--shadow-md);
          }
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(welcome);

      const closeBtn = welcome.querySelector(".welcome-close");
      const gotItBtn = welcome.querySelector(".welcome-button");

      const closeWelcome = () => {
        welcome.style.opacity = "0";
        setTimeout(() => welcome.remove(), 300);
        chrome.storage.local.set({ summaryse_welcome_shown: true });
      };

      closeBtn.addEventListener("click", closeWelcome);
      gotItBtn.addEventListener("click", closeWelcome);
      welcome.addEventListener("click", (e) => {
        if (e.target === welcome) closeWelcome();
      });
    }
  });
}

// Show welcome screen on page load
showWelcomeScreen();

// Ping background service worker on load to ensure it's awake
chrome.runtime.sendMessage(
  { type: "PING" },
  (response) => {
    if (chrome.runtime.lastError) {
      console.warn("[summaryse] Background service worker not responding on load:", chrome.runtime.lastError);
    } else {
      console.log("[summaryse] Background service worker is active");
    }
  }
);

console.log("Summaryse content script loaded");
