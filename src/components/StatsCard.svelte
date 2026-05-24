<script>
  export let stats = null;
</script>

{#if stats}
  <div class="summaryse-base-card stats-card">
    <div class="stats-grid">
      <div class="stat-item">
        <p class="stat-label">Original</p>
        <p class="stat-value">{stats.wordCount}</p>
        <p class="stat-unit">words</p>
      </div>

      <div class="stat-item">
        <p class="stat-label">Summary</p>
        <p class="stat-value">{stats.summaryWordCount}</p>
        <p class="stat-unit">words</p>
      </div>

      <div class="stat-item highlight">
        <p class="stat-label">Reduction</p>
        <p class="stat-value">{stats.reduction}%</p>
        <p class="stat-unit">smaller</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .stats-card {
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: rgba(30, 41, 59, 0.04);
    border-radius: 6px;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .stat-item.highlight {
    background: rgba(30, 41, 59, 0.08);
  }

  .stat-label {
    font-size: 12px;
    font-weight: 500;
    color: #999999;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #000000;
    margin: 4px 0 2px;
    font-family: 'Space Grotesk', sans-serif;
  }

  .stat-unit {
    font-size: 12px;
    color: #999999;
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

</style>
