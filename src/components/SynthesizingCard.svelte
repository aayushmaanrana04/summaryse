<script>
  // Combining chunks indicator
</script>

<div class="synthesizing-card">
  <div class="synthesizing-content">
    <div class="dots-loader">
      <span class="dot dot-1"></span>
      <span class="dot dot-2"></span>
      <span class="dot dot-3"></span>
    </div>
    <p class="status-text">Combining chunks into final summary...</p>
  </div>

  <div class="card-accent"></div>
</div>

<style>
  .synthesizing-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 20px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    position: relative;
    animation: cardRise 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .synthesizing-card::before {
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

  .synthesizing-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .dots-loader {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary, #1E293B);
    animation: bounce 1.4s infinite;
  }

  .dot-1 {
    animation-delay: -0.32s;
  }

  .dot-2 {
    animation-delay: -0.16s;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .status-text {
    color: rgba(30, 41, 59, 0.8);
    font-size: 13px;
    margin: 0;
    font-weight: 500;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .card-accent {
    display: none;
  }
</style>
