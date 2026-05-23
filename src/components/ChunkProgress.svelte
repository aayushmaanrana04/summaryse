<script>
  import { PHASES } from '../utils.js';

  export let chunks = [];
  export let currentChunkIndex = 0;
  export let phase = PHASES.INIT;
  export let isLargeText = false;

  const SQUARE_SIZE = 8;
  const SQUARE_GAP = 4;

  $: isProcessing = phase === PHASES.STREAMING || phase === PHASES.SUMMARIZING;
  $: isComplete = phase === PHASES.COMPLETE;
  $: isFinalizing = isLargeText && currentChunkIndex >= chunks.length && isProcessing;
  $: showChunks = isLargeText && chunks.length > 0;
  $: displaySquares = isFinalizing ? chunks.length : chunks.length;

  // For single text (no chunks) or during chunk processing
  $: chunkCount = chunks.length || 1;
</script>

{#if showChunks}
  <!-- Chunk progress squares -->
  <div class="progress-container">
    <div class="chunks-grid">
      {#if isFinalizing}
        <!-- Cascading animation during finalization -->
        {#each Array(displaySquares) as _, i}
          <div
            class="chunk-square"
            class:animated={true}
            style="--delay: {i * 100}ms"
            title={`Finalizing chunk ${i + 1}/${displaySquares}`}
          />
        {/each}
      {:else}
        <!-- Normal chunk processing display -->
        {#each chunks as chunk, i}
          <div
            class="chunk-square"
            class:done={i < currentChunkIndex}
            class:current={i === currentChunkIndex && isProcessing}
            class:pending={i > currentChunkIndex}
            title={`Chunk ${i + 1}/${chunks.length}`}
          />
        {/each}
      {/if}
    </div>
  </div>
{:else if !isLargeText && isProcessing}
  <!-- Single text - show cascading animation -->
  <div class="progress-container">
    <div class="chunks-grid">
      {#each Array(1) as _, i}
        <div
          class="chunk-square"
          class:animated={true}
          style="--delay: 0ms"
          title="Processing..."
        />
      {/each}
    </div>
  </div>
{/if}

<style>
  .progress-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    height: 24px;
    padding: 0;
  }

  /* Chunk squares */
  .chunks-grid {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .chunk-square {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .chunk-square.done {
    background: var(--color-primary, #1E293B);
  }

  .chunk-square.pending {
    border: 1.5px solid rgba(30, 41, 59, 0.3);
    background: transparent;
  }

  .chunk-square.current {
    background: var(--color-primary, #1E293B);
    animation: blink 600ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0.4;
    }
  }

  /* Cascading animation for finalization/single text */
  .chunk-square.animated {
    animation: cascade 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    animation-delay: var(--delay, 0ms);
  }

  @keyframes cascade {
    0% {
      background: transparent;
      border: 1.5px solid rgba(30, 41, 59, 0.3);
    }
    40% {
      background: transparent;
      border: 1.5px solid rgba(30, 41, 59, 0.3);
    }
    50% {
      background: var(--color-primary, #1E293B);
      border: 1.5px solid var(--color-primary, #1E293B);
    }
    60% {
      background: var(--color-primary, #1E293B);
      border: 1.5px solid var(--color-primary, #1E293B);
    }
    70% {
      background: transparent;
      border: 1.5px solid rgba(30, 41, 59, 0.3);
    }
    100% {
      background: transparent;
      border: 1.5px solid rgba(30, 41, 59, 0.3);
    }
  }
</style>
