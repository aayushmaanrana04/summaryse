<script>
  import ChunkProgress from './ChunkProgress.svelte';

  export let summaryStyle = 'bullets';
  export let onStyleChange = () => {};
  export let onCopy = () => {};
  export let onReset = () => {};
  export let onClose = () => {};
  export let canCopy = false;
  export let chunks = [];
  export let currentChunkIndex = 0;
  export let phase = 'init';
  export let isLargeText = false;

  const styles = [
    { key: 'bullets', label: 'Bullets' },
    { key: 'tldr', label: 'TL;DR' },
    { key: 'paragraph', label: 'Paragraph' }
  ];
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

  <div class="style-selector">
    {#each styles as style (style.key)}
      <button
        class="style-btn"
        class:active={summaryStyle === style.key}
        on:click={() => onStyleChange(style.key)}
        title={`${style.label} format`}
      >
        {style.label}
      </button>
    {/each}
  </div>

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

  .style-selector {
    display: flex;
    gap: 3px;
    background: rgba(0, 0, 0, 0.05);
    padding: 4px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }

  .style-btn {
    padding: 5px 10px;
    border: none;
    background: transparent;
    color: #000000;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 5px;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    white-space: nowrap;
  }

  .style-btn:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .style-btn.active {
    background: white;
    color: #000000;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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
