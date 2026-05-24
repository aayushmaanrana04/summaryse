<script>
  import MarkdownContent from './MarkdownContent.svelte';

  export let currentSummary = '';
  export let modalOpen = false;
  export let isBubble = false;
  export let isExpandedFinal = false;

  let canExpand = false;

  $: hasContent = currentSummary !== '';

  $: if (hasContent && isBubble && !canExpand) {
    // Defer expansion to next frame to avoid animation lag
    requestAnimationFrame(() => {
      canExpand = true;
    });
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
      <button
        class="expand-btn"
        on:click={() => (modalOpen = true)}
        title="Expand to full screen"
      >
        ⛶
      </button>
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
    animation: bubbleExpandGPU 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    will-change: transform, opacity, border-radius;
  }

  @keyframes bubbleExpandGPU {
    0% {
      transform: scale(0.06);
      border-radius: 50%;
      opacity: 0.8;
    }
    50% {
      border-radius: 24px;
    }
    100% {
      transform: scale(1);
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

  .expand-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: #000000;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .expand-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    transform: scale(1.1);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

</style>
