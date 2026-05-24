<script>
  import MarkdownContent from './MarkdownContent.svelte';

  export let summary = '';
  export let isStreaming = false;
  export let index = 0;
  let className = '';
  export { className as class };
</script>

<div class="summaryse-base-card chunk-card {className}">
  <div class="card-content">
    {#if summary === ''}
      <!-- Empty state -->
      <p class="empty-text">Summarizing chunk {index + 1}...</p>
    {:else}
      <!-- Markdown content -->
      <MarkdownContent content={summary} />
      {#if isStreaming}
        <div class="cursor"></div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .chunk-card {
    contain: layout style paint;
  }

  .chunk-card.slide-out-left {
    animation: slideOutLeft 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .chunk-card.slide-in-right {
    animation: slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideOutLeft {
    to {
      opacity: 0;
      transform: translateX(-100%);
      height: 0;
      padding: 0;
      margin: 0;
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
    color: #999999;
    font-size: 13px;
    margin: 8px 0;
    font-style: italic;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
