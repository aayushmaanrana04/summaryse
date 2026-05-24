<script>
  export let errorMessage = '';
  export let onRetry = () => {};
</script>

<div class="summaryse-base-card error-card">
  <div class="error-content">
    <div class="error-icon">⚠️</div>
    <p class="error-title">Oops, something went wrong</p>
    <p class="error-message">{errorMessage}</p>

    <button class="retry-btn" on:click={onRetry}>Try Again</button>
  </div>
</div>

<style>
  .error-card {
  }

  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .error-icon {
    font-size: 32px;
  }

  .error-title {
    font-size: 16px;
    font-weight: 600;
    color: #000000;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
  }

  .error-message {
    font-size: 13px;
    color: #666666;
    margin: 0;
    line-height: 1.4;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .retry-btn {
    margin-top: 8px;
    padding: 10px 20px;
    border: none;
    background: #000000;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 6px;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .retry-btn:hover {
    background: #333333;
    transform: translateY(-2px);
  }

  .retry-btn:active {
    transform: translateY(0);
  }

</style>
