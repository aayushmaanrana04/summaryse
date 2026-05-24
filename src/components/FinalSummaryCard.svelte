<script>
  import MarkdownContent from './MarkdownContent.svelte';

  export let currentSummary = '';
  export let modalOpen = false;
  export let isBubble = false;
  export let isExpandedFinal = false;
  export let onCopy = () => {};
  export let onClose = () => {};

  let canExpand = false;
  let prevSummaryEmpty = true;

  $: hasContent = currentSummary !== '';

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

<div class="summaryse-base-card final-summary-card" class:bubble={isBubble} class:expanded={shouldExpand} class:expanded-final={isExpandedFinal}>
  {#if isBubble && !hasContent}
    <!-- Bubble mode with spinner -->
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
  {:else}
    <div class="card-header">
      <h2 class="card-title">Summary</h2>
      <div class="action-buttons">
        <button
          class="icon-btn copy-btn"
          on:click={onCopy}
          title="Copy summary"
        >
          📋
        </button>
        <button
          class="icon-btn close-btn"
          on:click={onClose}
          title="Close widget"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="card-content">
      <MarkdownContent content={currentSummary} />
    </div>
  {/if}
</div>

<style>
  .final-summary-card {
    gap: 12px;
    contain: layout style paint;
  }

  /* Bubble mode - small circular initial state */
  .final-summary-card.bubble {
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
  .final-summary-card.bubble.expanded {
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

  /* Expanded final state - full screen card */
  .final-summary-card.expanded-final {
    width: 650px !important;
    height: auto;
    border-radius: 32px;
    padding: 20px;
    animation: finalExpand 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes finalExpand {
    0% {
      opacity: 0.95;
      transform: scale(1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
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

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #000000;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
  }

  .action-buttons {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .icon-btn {
    width: 30px;
    height: 30px;
    border: none;
    background: rgba(0, 0, 0, 0.04);
    color: #000000;
    font-size: 15px;
    cursor: pointer;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .icon-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .icon-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

</style>
