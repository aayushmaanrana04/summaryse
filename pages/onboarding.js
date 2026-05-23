// Handle model loading and progress display
chrome.runtime.sendMessage({ type: "PING" }, (response) => {
  if (chrome.runtime.lastError) {
    console.error("Service worker not responding");
    return;
  }
});

// Listen for progress updates from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROGRESS") {
    updateProgress(message.text, message.percent || 0);
  } else if (message.type === "READY") {
    showReady();
  } else if (message.type === "ERROR") {
    showError(message.error);
  }
});

function updateProgress(text, percent) {
  const progressPercent = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");

  if (percent) {
    progressPercent.textContent = Math.min(percent, 99);
    progressFill.style.width = Math.min(percent, 99) + "%";
  }

  console.log("[onboarding] Progress:", text, percent);
}

function showReady() {
  const progressSection = document.getElementById("progressSection");
  const readySection = document.getElementById("readySection");

  progressSection.classList.remove("active");
  readySection.classList.add("active");

  console.log("[onboarding] Model ready!");
}

function showError(error) {
  const progressSection = document.getElementById("progressSection");
  const readySection = document.getElementById("readySection");

  progressSection.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 40px; margin-bottom: 16px;">⚠️</div>
      <div style="font-size: 16px; font-weight: 500; color: #C5221F; margin-bottom: 12px;">Setup Failed</div>
      <p style="font-size: 13px; color: #5F6368; margin-bottom: 20px;">Error: ${error}</p>
      <button class="button" onclick="location.reload()" style="background: #C5221F;">Retry</button>
    </div>
  `;
}

// Start the model loading process
console.log("[onboarding] Starting model load...");
chrome.runtime.sendMessage({ type: "LOAD_MODEL" }, (response) => {
  if (chrome.runtime.lastError) {
    console.error("[onboarding] Failed to send LOAD_MODEL:", chrome.runtime.lastError);
  } else {
    console.log("[onboarding] LOAD_MODEL sent successfully");
  }
});

// Auto-close after ready (optional - user can close manually)
let autoCloseTimer = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "READY") {
    // Auto-close after 3 seconds
    autoCloseTimer = setTimeout(() => {
      window.close();
    }, 3000);
  }
});
