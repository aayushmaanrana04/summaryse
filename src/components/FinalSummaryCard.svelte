<script>
  export let currentSummary = '';
  export let modalOpen = false;

  // Parse bullet points from summary text
  function parseBullets(text) {
    if (!text) return [];
    return text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        const cleaned = line.replace(/^[-•*]\s*/, '').trim();
        return cleaned || line.trim();
      });
  }

  $: bullets = parseBullets(currentSummary);
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
    <div class="bullets-container">
      {#each bullets as bullet, i (i)}
        <div class="bullet-point" style="animation-delay: {i * 30}ms">
          <span class="bullet-marker">•</span>
          <span class="bullet-text">{bullet}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="card-accent"></div>
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

  .bullets-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bullet-point {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    animation: fadeInBullet 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
  }

  @keyframes fadeInBullet {
    from {
      opacity: 0;
      transform: translateX(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .bullet-marker {
    color: var(--color-primary, #1E293B);
    font-weight: 500;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .bullet-text {
    color: rgba(30, 41, 59, 0.9);
    font-size: 14px;
    line-height: 1.5;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    word-break: break-word;
  }

  .card-accent {
    display: none;
  }
</style>
