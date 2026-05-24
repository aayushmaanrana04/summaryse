<script>
  import MarkdownContent from './MarkdownContent.svelte';

  export let currentSummary = '';
  export let onClose = () => {};

  $: bullets = parseBullets(currentSummary);

  function copy() {
    navigator.clipboard.writeText(currentSummary);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<div
  class="modal-backdrop"
  role="button"
  tabindex="0"
  on:click={handleBackdropClick}
  on:keydown={handleKeyDown}
>
  <div class="modal-container">
    <div class="modal-header">
      <h1 class="modal-title">Full Summary</h1>
      <button class="close-btn" on:click={onClose} title="Close modal">✕</button>
    </div>

    <div class="modal-content">
      <MarkdownContent content={currentSummary} />
    </div>

    <div class="modal-footer">
      <button class="copy-btn" on:click={copy}>
        📋 Copy Summary
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    background: rgba(225, 237, 247, 0.98);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .modal-title {
    font-size: 20px;
    font-weight: 600;
    color: #000000;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #000000;
    font-size: 16px;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .modal-content::-webkit-scrollbar {
    width: 6px;
  }

  .modal-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }


  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(30, 41, 59, 0.02);
  }

  .copy-btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: #000000;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 6px;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .copy-btn:hover {
    background: #333333;
    transform: translateY(-2px);
  }

  .copy-btn:active {
    transform: translateY(0);
  }
</style>
