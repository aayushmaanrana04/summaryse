<script>
  // Combining chunks indicator
</script>

<div class="summaryse-base-card synthesizing-card">
  <div class="synthesizing-content">
    <div class="dots-loader">
      <span class="dot dot-1"></span>
      <span class="dot dot-2"></span>
      <span class="dot dot-3"></span>
    </div>
    <p class="status-text">Combining chunks into final summary...</p>
  </div>
</div>

<style>
  .synthesizing-card {
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
    background: #000000;
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
    color: #000000;
    font-size: 13px;
    margin: 0;
    font-weight: 500;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

</style>
