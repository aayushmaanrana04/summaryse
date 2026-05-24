<script>
  export let isBubbleMode = false;
  export let isFinalOnly = false;
</script>

<div class="content-area" class:bubble-mode={isBubbleMode} class:final-only={isFinalOnly}>
  <slot />
</div>

<style>
  .content-area {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: visible;
    max-height: calc(100vh - 80px);
    padding-right: 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }

  .content-area.bubble-mode {
    align-items: flex-end;
    justify-content: flex-start;
    gap: 8px;
    padding-right: 0;
  }

  .content-area.final-only {
    align-items: center;
    justify-content: center;
  }

  .content-area::-webkit-scrollbar {
    width: 6px;
  }

  .content-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .content-area::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .content-area::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
</style>
