<script>
  import { parseMarkdown } from '../utils.js';

  export let content = '';
  export let inline = false;

  $: html = parseMarkdown(content);
</script>

{#if inline}
  <span class="markdown-inline">{@html html}</span>
{:else}
  <div class="markdown-content">{@html html}</div>
{/if}

<style>
  :global(.markdown-content),
  :global(.markdown-inline) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #000000;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  :global(.markdown-content p) {
    margin: 8px 0;
  }

  :global(.markdown-content p:first-child) {
    margin-top: 0;
  }

  :global(.markdown-content p:last-child) {
    margin-bottom: 0;
  }

  :global(.markdown-content strong) {
    font-weight: 600;
    color: #000000;
  }

  :global(.markdown-content em) {
    font-style: italic;
  }

  :global(.markdown-content code) {
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  :global(.markdown-content ul),
  :global(.markdown-content ol) {
    margin: 8px 0;
    padding-left: 24px;
  }

  :global(.markdown-content li) {
    margin: 4px 0;
  }

  :global(.markdown-content blockquote) {
    margin: 8px 0;
    padding-left: 12px;
    border-left: 3px solid #333333;
    color: #666666;
  }

  :global(.markdown-content a) {
    color: #0066cc;
    text-decoration: underline;
    cursor: pointer;
  }

  :global(.markdown-content a:hover) {
    opacity: 0.8;
  }

  :global(.markdown-content h1),
  :global(.markdown-content h2),
  :global(.markdown-content h3) {
    color: #000000;
    font-weight: 600;
    margin: 12px 0 8px 0;
  }

  :global(.markdown-content h1) {
    font-size: 1.5em;
  }

  :global(.markdown-content h2) {
    font-size: 1.25em;
  }

  :global(.markdown-content h3) {
    font-size: 1.1em;
  }
</style>
