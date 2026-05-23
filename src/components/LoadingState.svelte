<script>
  export let loadingProgress = 0;
  export let isFirstUse = false;
</script>

<div class="loading-state">
  <div class="loading-content">
    {#if isFirstUse}
      <div class="first-use">
        <div class="spinner"></div>
        <p class="status-text">Loading AI model for offline summarization...</p>
        <p class="subtitle">This happens once on first use</p>
      </div>
    {:else}
      <div class="loading">
        <div class="spinner"></div>
        <p class="status-text">Preparing summary...</p>
      </div>
    {/if}

    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {loadingProgress}%"></div>
      </div>
      <p class="progress-text">{Math.round(loadingProgress)}%</p>
    </div>
  </div>
</div>

<style>
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    width: 100%;
  }

  .first-use,
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(30, 41, 59, 0.1);
    border-top-color: var(--color-primary, #1E293B);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .status-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-primary, #1E293B);
    margin: 0;
    text-align: center;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .subtitle {
    font-size: 12px;
    color: rgba(30, 41, 59, 0.6);
    margin: 0;
    text-align: center;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .progress-container {
    width: 100%;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary, #1E293B), var(--color-primary-200, #475569));
    border-radius: 2px;
    transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-text {
    font-size: 12px;
    color: rgba(30, 41, 59, 0.6);
    text-align: center;
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
