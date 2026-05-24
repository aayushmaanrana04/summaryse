// Markdown parser worker - runs off main thread
import { parseMarkdown } from './utils.js';

self.onmessage = (event) => {
  const { id, markdown } = event.data;
  try {
    const html = parseMarkdown(markdown);
    self.postMessage({ id, html, error: null });
  } catch (error) {
    self.postMessage({ id, html: null, error: error.message });
  }
};
