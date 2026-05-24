<script>
  import MarkdownContent from './MarkdownContent.svelte';

  export let currentSummary = '';
  export let modalOpen = false;
</script>

<div class="summaryse-base-card final-summary-card">
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
    gap: 12px;
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
