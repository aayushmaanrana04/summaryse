<script>
  import MarkdownContent from './MarkdownContent.svelte';

  export let currentSummary = '';
  export let modalOpen = false;
</script>

<div class="final-summary-card">
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
</div>

<style>
  .final-summary-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    position: relative;
    animation: cardRise 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .final-summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      var(--color-primary, #1E293B) 0%,
      var(--color-primary-200, #475569) 50%,
      transparent 100%
    );
    border-radius: 8px 8px 0 0;
    opacity: 0.6;
  }

  @keyframes cardRise {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
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
    color: var(--color-primary, #1E293B);
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
  }

  .expand-btn {
    width: 28px;
    height: 28px;
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
