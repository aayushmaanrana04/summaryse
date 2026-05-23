<script>
  export let errorMessage = '';
  export let onRetry = () => {};
</script>

<div class="error-card">
  <div class="error-content">
    <div class="error-icon">⚠️</div>
    <p class="error-title">Oops, something went wrong</p>
    <p class="error-message">{errorMessage}</p>

    <button class="retry-btn" on:click={onRetry}>Try Again</button>
  </div>
</div>

<style>
  .error-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 20px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.2);
    position: relative;
    animation: cardRise 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .error-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      rgba(239, 68, 68, 0.8) 0%,
      rgba(239, 68, 68, 0.5) 50%,
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
    color: var(--color-primary, #1E293B);
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
  }

  .error-message {
    font-size: 13px;
    color: rgba(30, 41, 59, 0.7);
    margin: 0;
    line-height: 1.4;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .retry-btn {
    margin-top: 8px;
    padding: 10px 20px;
    border: none;
    background: var(--color-primary, #1E293B);
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 6px;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .retry-btn:hover {
    background: rgba(30, 41, 59, 0.9);
    transform: translateY(-2px);
  }

  .retry-btn:active {
    transform: translateY(0);
  }

</style>
