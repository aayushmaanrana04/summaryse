<script>
  export let stats = null;
</script>

{#if stats}
  <div class="stats-card">
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

    <div class="card-accent"></div>
  </div>
{/if}

<style>
  .stats-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    position: relative;
    animation: cardRise 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .stats-card::before {
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
    color: rgba(30, 41, 59, 0.7);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-primary, #1E293B);
    margin: 4px 0 2px;
    font-family: 'Space Grotesk', sans-serif;
  }

  .stat-unit {
    font-size: 12px;
    color: rgba(30, 41, 59, 0.6);
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .card-accent {
    display: none;
  }
</style>
