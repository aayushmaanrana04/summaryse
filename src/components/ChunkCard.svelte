<script>
  import { parseBullets } from '../utils.js';

  export let summary = '';
  export let isStreaming = false;
  export let index = 0;
  let className = '';
  export { className as class };

  $: bullets = parseBullets(summary);
</script>

<div class="chunk-card {className}">
  <div class="card-content">
    {#if summary === ''}
      <!-- Empty state -->
      <p class="empty-text">Summarizing chunk {index + 1}...</p>
    {:else}
      <!-- Bullets view -->
      <div class="bullets-container">
        {#each bullets as bullet, i (i)}
          <div
            class="bullet-point"
            class:streaming={isStreaming && i === bullets.length - 1}
          >
            <span class="bullet-marker">•</span>
            <span class="bullet-text">{bullet}</span>
          </div>
        {/each}

        {#if isStreaming}
          <div class="cursor"></div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .chunk-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    contain: layout style paint;
    animation: cardRise 400ms cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .chunk-card::before {
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

  .chunk-card.slide-out-left {
    animation: slideOutLeft 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .chunk-card.slide-in-right {
    animation: slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1);
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

  @keyframes slideOutLeft {
    to {
      opacity: 0;
      transform: translateX(-100%);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .empty-text {
    color: rgba(30, 41, 59, 0.6);
    font-size: 13px;
    margin: 8px 0;
    font-style: italic;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    animation: fadeInBullet 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bullet-point.streaming {
    animation: none;
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

  .cursor {
    display: inline-block;
    width: 2px;
    height: 14px;
    background: var(--color-primary, #1E293B);
    margin-left: 4px;
    margin-top: 4px;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

</style>
