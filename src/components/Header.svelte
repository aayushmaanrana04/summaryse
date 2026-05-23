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

<div class="header">
  <div class="header-left">
    <div class="logo">
      <span class="logo-icon">✨</span>
      <span class="logo-text">Summaryse</span>
    </div>
    <ChunkProgress {chunks} {currentChunkIndex} {phase} {isLargeText} />
  </div>

  <div class="controls">
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
</div>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    gap: 16px;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--color-primary, #1E293B);
    font-size: 14px;
    font-family: 'Space Grotesk', sans-serif;
  }

  .logo-icon {
    font-size: 16px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .style-selector {
    display: flex;
    gap: 4px;
    background: rgba(0, 0, 0, 0.04);
    padding: 4px;
    border-radius: 6px;
  }

  .style-btn {
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--color-primary, #1E293B);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .style-btn:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  .style-btn.active {
    background: white;
    color: var(--color-primary, #1E293B);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-primary, #1E293B);
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .icon-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.08);
    transform: scale(1.05);
  }

  .icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .copy-btn {
    color: var(--color-primary, #1E293B);
  }

  .reset-btn {
    color: var(--color-primary, #1E293B);
  }

  .close-btn {
    color: var(--color-primary, #1E293B);
  }
</style>
