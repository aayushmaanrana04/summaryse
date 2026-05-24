<script>
  import ChunkProgress from './ChunkProgress.svelte';

  export let onCopy = () => {};
  export let onReset = () => {};
  export let onClose = () => {};
  export let canCopy = false;
  export let chunks = [];
  export let currentChunkIndex = 0;
  export let phase = 'init';
  export let isLargeText = false;
</script>

<div class="summaryse-base-card header">
  <div class="logo">
    <span class="logo-icon">✨</span>
    <span class="logo-text">Summaryse</span>
  </div>

  <div class="progress-section">
    <ChunkProgress {chunks} {currentChunkIndex} {phase} {isLargeText} />
  </div>

  <div class="spacer"></div>

  <div class="action-buttons">
    <button
      class="icon-btn copy-btn"
      on:click={onCopy}
      disabled={!canCopy}
      title="Copy summary"
    >
      📋
    </button>
    <button
      class="icon-btn reset-btn"
      on:click={onReset}
      title="Summarize again"
    >
      🔄
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

<style>
  .header {
    padding: 12px 16px;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    min-height: auto;
    width: 100% !important;
    flex-shrink: 1 !important;
    flex-wrap: nowrap;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #000000;
    font-size: 15px;
    font-family: 'Space Grotesk', sans-serif;
    letter-spacing: -0.5px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .logo-icon {
    font-size: 18px;
  }

  .progress-section {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .spacer {
    flex: 1;
    min-width: 0;
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
</style>
