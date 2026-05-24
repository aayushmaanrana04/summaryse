<script>
  import { onMount } from 'svelte';
  import MarkdownContent from './MarkdownContent.svelte';

  export let summary = '';
  export let isStreaming = false;
  export let index = 0;
  export let isBubble = false;
  export let compactExpanded = false;
  export let isCollapsing = false;
  let className = '';
  export { className as class };

  let canExpand = false;
  let prevSummaryEmpty = true;

  $: hasContent = summary !== '';

  // Only expand when transitioning from empty to non-empty
  $: {
    const isEmpty = !hasContent;
    if (prevSummaryEmpty && !isEmpty && isBubble && !canExpand) {
      requestAnimationFrame(() => {
        canExpand = true;
      });
    }
    prevSummaryEmpty = isEmpty;
  }

  $: shouldExpand = canExpand && isBubble;
</script>

<div class="summaryse-base-card chunk-card {className}" class:bubble={isBubble} class:expanded={shouldExpand} class:compact={compactExpanded && shouldExpand} class:collapsing={isCollapsing}>
  <div class="card-content">
    {#if isBubble && !hasContent}
      <!-- Bubble mode with spinner -->
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
    {:else if summary === ''}
      <!-- Empty state -->
      <p class="empty-text">Summarizing chunk {index + 1}...</p>
    {:else}
      <!-- Markdown content -->
      <MarkdownContent content={summary} />
      {#if isStreaming}
        <div class="cursor"></div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .chunk-card {
    contain: layout style paint;
    will-change: auto;
  }

  /* Bubble mode - small circular initial state */
  .chunk-card.bubble {
    width: 40px !important;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    padding: 0;
    background: rgba(225, 237, 247, 0.95);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    transition: none;
    will-change: width, border-radius;
  }

  /* Expanded bubble with GPU-optimized animation */
  .chunk-card.bubble.expanded {
    width: 650px !important;
    height: auto;
    border-radius: 32px;
    padding: 20px;
    animation: bubbleExpandLeft 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    will-change: transform, border-radius, opacity;
    transform-origin: right center;
  }

  @keyframes bubbleExpandLeft {
    0% {
      transform: scaleX(0.06);
      height: 40px;
      border-radius: 20px;
      opacity: 0.8;
    }
    50% {
      transform: scaleX(1.05);
      height: 40px;
      border-radius: 20px;
      opacity: 1;
    }
    100% {
      transform: scaleX(1);
      height: auto;
      border-radius: 32px;
      opacity: 1;
    }
  }

  /* Collapse animation when merging */
  .chunk-card.bubble.collapsing {
    animation: bubbleCollapse 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    will-change: transform, opacity;
  }

  @keyframes bubbleCollapse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.5);
    }
  }

  /* Compact expanded styling for chunks state */
  .chunk-card.bubble.expanded.compact {
    padding: 16px;
  }

  .chunk-card.bubble.expanded.compact :global(.card-content) {
    font-size: 13px;
    line-height: 1.4;
  }

  .chunk-card.bubble.expanded.compact :global(h1) {
    font-size: 14px;
    margin: 8px 0 4px 0;
  }

  .chunk-card.bubble.expanded.compact :global(h2) {
    font-size: 13px;
    margin: 6px 0 3px 0;
  }

  .chunk-card.bubble.expanded.compact :global(h3) {
    font-size: 12px;
    margin: 4px 0 2px 0;
  }

  .chunk-card.bubble.expanded.compact :global(p) {
    margin: 4px 0;
  }

  .chunk-card.bubble.expanded.compact :global(ul),
  .chunk-card.bubble.expanded.compact :global(ol) {
    margin: 4px 0;
    padding-left: 16px;
  }

  .chunk-card.bubble.expanded.compact :global(li) {
    margin: 2px 0;
  }

  .chunk-card.slide-out-left {
    animation: slideOutLeft 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .chunk-card.slide-in-right {
    animation: slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideOutLeft {
    to {
      opacity: 0;
      transform: translateX(-100%);
      height: 0;
      padding: 0;
      margin: 0;
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(30, 41, 59, 0.1);
    border-top-color: var(--color-primary, #1E293B);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-text {
    color: #999999;
    font-size: 13px;
    margin: 8px 0;
    font-style: italic;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 14px;
    background: var(--color-primary, #1E293B);
    margin-left: 4px;
    margin-top: 4px;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

</style>
