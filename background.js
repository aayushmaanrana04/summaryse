// Manifest V3 Service Worker - delegates AI to offscreen document

const pendingRequests = new Map();

async function ensureOffscreenExists() {
  try {
    const offscreenUrl = chrome.runtime.getURL("offscreen.html");
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl]
    });

    if (existingContexts.length === 0) {
      console.log("[background] Creating offscreen document...");
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["WORKERS"],
        justification: "Run local AI inference for text summarization"
      });
      console.log("[background] Offscreen document created");
    } else {
      console.log("[background] Offscreen document already exists");
    }
  } catch (error) {
    console.error("[background] Failed to create offscreen document:", error);
    throw error;
  }
}

async function sendToOffscreen(request) {
  try {
    await ensureOffscreenExists();
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(request, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  } catch (error) {
    console.error("[background] Failed to send message to offscreen:", error);
    throw error;
  }
}

// Create context menu on install and show onboarding
chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: "summarize-selection",
    title: "Summarize with Summaryse",
    contexts: ["selection"]
  });

  // Show onboarding only on first install
  if (details.reason === "install") {
    chrome.storage.local.get("summaryse_onboarding_shown", (data) => {
      if (!data.summaryse_onboarding_shown) {
        chrome.tabs.create({ url: "onboarding.html" });
        chrome.storage.local.set({ summaryse_onboarding_shown: true });
      }
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarize-selection") {
    const selectedText = info.selectionText;

    // Send message to content script to create widget
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "SUMMARIZE_TEXT",
        text: selectedText
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[background] Failed to send message to content script:", chrome.runtime.lastError);
        } else {
          console.log("[background] Widget creation request sent to content script");
        }
      }
    );
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.type === "PING") {
      console.log("[background] Received PING, service worker is awake");
      sendResponse({ success: true, message: "pong" });
      return true;
    }

    if (request.type === "LOAD_MODEL" || request.type === "SUMMARIZE") {
      const requestId = `${sender.tab.id}-${Date.now()}`;
      console.log(`[background] Received ${request.type} from tab ${sender.tab.id}`);

      pendingRequests.set(requestId, sender.tab.id);
      sendResponse({ success: true });

      // Forward to offscreen document
      sendToOffscreen({
        ...request,
        requestId: requestId
      }).catch((error) => {
        console.error(`[background] Failed to send ${request.type} to offscreen:`, error);
        chrome.tabs.sendMessage(
          sender.tab.id,
          { type: "ERROR", error: error.message },
          () => {}
        );
      });

      return true;
    }
  } catch (error) {
    console.error("[background] Message handler error:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

// Handle messages from offscreen document
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.requestId && pendingRequests.has(request.requestId)) {
    const tabId = pendingRequests.get(request.requestId);

    // Forward to content script
    chrome.tabs.sendMessage(
      tabId,
      request,
      () => {
        if (chrome.runtime.lastError) {
          console.log("[background] Tab not available for response:", chrome.runtime.lastError);
        }
      }
    );

    // Clean up after completion or error
    if (request.type === "COMPLETE" || request.type === "ERROR") {
      pendingRequests.delete(request.requestId);
    }
  }
});

console.log("Summaryse background service worker loaded");
