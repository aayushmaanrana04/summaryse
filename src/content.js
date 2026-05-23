// Entry point for Summaryse Chrome extension widget
// Mounts the Widget Svelte component into a Shadow DOM for proper isolation

import Widget from './components/Widget.svelte';

let summaryseWidget = null;

const globalStyles = `
  :root {
    --color-primary: #1E293B;
    --color-primary-200: #475569;
    --shadow-elevation-1: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-elevation-2: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-elevation-3: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;

export function mount(text) {
  // Clean up existing widget if present
  const existing = document.getElementById('summaryse-host');
  if (existing) {
    existing.remove();
  }

  // Create host element and attach shadow DOM
  const host = document.createElement('div');
  host.id = 'summaryse-host';
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Inject global styles into shadow DOM
  const styleElement = document.createElement('style');
  styleElement.textContent = globalStyles;
  shadowRoot.appendChild(styleElement);

  // Create a container element inside the shadow root for Svelte to mount into
  const container = document.createElement('div');
  container.id = 'summaryse-container';
  shadowRoot.appendChild(container);

  // Mount the Svelte Widget component into the container
  summaryseWidget = new Widget({
    target: container,
    props: { text }
  });

  // Add backdrop class to body for the gradient overlay
  document.body.classList.add('summaryse-backdrop-added');

  return summaryseWidget;
}

export function unmount() {
  if (summaryseWidget) {
    summaryseWidget.$destroy();
    summaryseWidget = null;
  }
  const host = document.getElementById('summaryse-host');
  if (host) {
    host.remove();
  }
  document.body.classList.remove('summaryse-backdrop-added');
}

// Handle context menu request from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === 'SUMMARIZE_TEXT') {
      console.log('[summaryse-widget] Received context menu request');
      if (message.text && message.text.trim().length > 0) {
        mount(message.text);
        sendResponse({ success: true });
      } else {
        console.error('No text provided');
        sendResponse({ success: false, error: 'No text provided' });
      }
    }
  } catch (error) {
    console.error('[summaryse-widget] Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// Handle keyboard shortcut (Cmd+Shift+S / Ctrl+Shift+S)
document.addEventListener('keydown', (e) => {
  const isShortcut = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyS';

  if (isShortcut) {
    e.preventDefault();
    console.log('[summaryse] Keyboard shortcut triggered - extracting page text');

    const visibleText = getVisiblePageText();

    if (visibleText && visibleText.length > 0) {
      console.log(`[summaryse] Extracted ${visibleText.length} characters from page`);
      mount(visibleText);
    } else {
      console.warn('[summaryse] No visible text found on page');
      alert('No visible text found to summarize');
    }
  }
});

// Extract visible DOM text for auto-summarization
function getVisiblePageText() {
  const hiddenTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'TITLE', 'HEAD']);
  const text = [];

  function walk(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const parent = child.parentElement;
        if (parent && !hiddenTags.has(parent.tagName)) {
          const style = window.getComputedStyle(parent);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            const content = child.textContent.trim();
            if (content) text.push(content);
          }
        }
      } else if (child.nodeType === 1) {
        if (!hiddenTags.has(child.tagName)) {
          const style = window.getComputedStyle(child);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            walk(child);
          }
        }
      }
    }
  }

  walk(document.body);
  return text.join(' ').trim();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  unmount();
});
