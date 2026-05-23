<script>
  import { onMount, onDestroy } from 'svelte';
  import { estimateTokens, splitIntoChunks, isLargeText, PHASES } from '../utils.js';

  import Header from './Header.svelte';
  import ContentArea from './ContentArea.svelte';
  import LoadingState from './LoadingState.svelte';
  import SkeletonCard from './SkeletonCard.svelte';
  import ChunkCard from './ChunkCard.svelte';
  import SynthesizingCard from './SynthesizingCard.svelte';
  import FinalSummaryCard from './FinalSummaryCard.svelte';
  import StatsCard from './StatsCard.svelte';
  import ErrorCard from './ErrorCard.svelte';
  import Modal from './Modal.svelte';

  export let text = '';

  // State
  let phase = PHASES.INIT;
  let summaryStyle = 'bullets';
  let currentSummary = '';
  let modelLoaded = false;
  let isLargeTextFlag = false;
  let chunks = [];
  let chunkSummaries = [];
  let currentChunkIndex = 0;
  let finalized = false;
  let modalOpen = false;
  let loadingProgress = 0;
  let errorMessage = '';
  let slidingOut = false;

  onMount(() => {
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    initialize();

    return () => {
      chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
    };
  });

  onDestroy(() => {
    document.body.classList.remove('summaryse-backdrop-added');
  });

  async function initialize() {
    console.log('[summaryse-widget] Initializing');

    // Check if model is already loaded
    chrome.storage.local.get('summaryse_model_ready', (result) => {
      if (result.summaryse_model_ready) {
        modelLoaded = true;
        proceedWithInit();
      } else {
        proceedWithInit();
      }
    });
  }

  async function proceedWithInit() {
    try {
      // Wake up service worker
      await wakeUpServiceWorker();

      if (modelLoaded) {
        startSummarization();
      } else {
        // First use - load model
        phase = PHASES.LOADING_MODEL;
        chrome.runtime.sendMessage({ type: 'LOAD_MODEL' });
      }
    } catch (error) {
      console.error('[summaryse-widget] Init error:', error);
      showError(`Failed to initialize: ${error.message}`);
    }
  }

  function wakeUpServiceWorker() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Service worker wake-up timeout'));
      }, 5000);

      chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
        clearTimeout(timeout);
        if (response) {
          resolve();
        } else {
          reject(new Error('No response from service worker'));
        }
      });
    });
  }

  function startSummarization() {
    console.log('[summaryse-widget] Starting summarization');
    phase = PHASES.SUMMARIZING;

    isLargeTextFlag = isLargeText(text);

    if (isLargeTextFlag) {
      // Large text: chunk it
      chunks = splitIntoChunks(text);
      chunkSummaries = new Array(chunks.length).fill('');
      currentChunkIndex = 0;

      console.log(`[summaryse-widget] Large text detected: ${chunks.length} chunks`);

      // Initialize with skeleton cards
      phase = PHASES.STREAMING;
      processNextChunk();
    } else {
      // Small text: single summarization
      phase = PHASES.STREAMING;
      chrome.runtime.sendMessage({
        type: 'SUMMARIZE',
        text: text,
        style: summaryStyle
      });
    }
  }

  function processNextChunk() {
    if (currentChunkIndex >= chunks.length) {
      mergeChunks();
      return;
    }

    const chunk = chunks[currentChunkIndex];
    console.log(`[summaryse-widget] Processing chunk ${currentChunkIndex + 1}/${chunks.length}`);

    chrome.runtime.sendMessage({
      type: 'SUMMARIZE',
      text: chunk.text,
      style: summaryStyle,
      chunkIndex: currentChunkIndex,
      totalChunks: chunks.length,
      isChunk: true
    });
  }

  function mergeChunks() {
    const combined = chunkSummaries.join(' ');
    console.log('[summaryse-widget] Merging chunks for final summary');

    slidingOut = true;

    setTimeout(() => {
      finalized = true;
      chrome.runtime.sendMessage({
        type: 'SUMMARIZE',
        text: combined,
        style: summaryStyle,
        isFinalSummary: true
      });
    }, 300);
  }

  function handleBackgroundMessage(message) {
    console.log('[summaryse-widget] Message received:', message.type);

    switch (message.type) {
      case 'PROGRESS':
        loadingProgress = message.percent || message.progress || 0;
        break;

      case 'READY':
        console.log('[summaryse-widget] Model ready');
        modelLoaded = true;
        chrome.storage.local.set({ summaryse_model_ready: true });
        startSummarization();
        break;

      case 'TOKEN':
        handleToken(message);
        break;

      case 'COMPLETE':
        handleComplete(message);
        break;

      case 'ERROR':
        showError(message.error || 'Unknown error');
        break;
    }
  }

  function handleToken(message) {
    const token = message.token || '';

    if (message.isFinalSummary) {
      // Accumulate but don't render until COMPLETE
      currentSummary += token;
    } else if (message.chunkIndex !== undefined) {
      // Chunk streaming - mutate in place, then signal change without copying
      chunkSummaries[message.chunkIndex] += token;
      chunkSummaries = chunkSummaries;
    } else {
      // Single text streaming
      currentSummary += token;
    }
  }

  function handleComplete(message) {
    if (message.isFinalSummary) {
      currentSummary = message.summary || currentSummary;
      finalized = true;
      phase = PHASES.COMPLETE;
      console.log('[summaryse-widget] Summarization complete');
    } else if (message.chunkIndex !== undefined) {
      // Chunk complete
      chunkSummaries[message.chunkIndex] = message.summary || chunkSummaries[message.chunkIndex];
      chunkSummaries = chunkSummaries;

      currentChunkIndex++;
      if (currentChunkIndex < chunks.length) {
        processNextChunk();
      } else {
        mergeChunks();
      }
    } else {
      // Single text complete
      currentSummary = message.summary || currentSummary;
      phase = PHASES.COMPLETE;
      console.log('[summaryse-widget] Summarization complete');
    }
  }

  function showError(message) {
    errorMessage = message;
    phase = PHASES.ERROR;
    console.error('[summaryse-widget]', message);
  }

  function copy() {
    if (currentSummary) {
      navigator.clipboard.writeText(currentSummary);
    }
  }

  function reset() {
    phase = PHASES.INIT;
    currentSummary = '';
    chunkSummaries = [];
    currentChunkIndex = 0;
    finalized = false;
    slidingOut = false;
    startSummarization();
  }

  function closeWidget() {
    const host = document.getElementById('summaryse-host');
    if (host) {
      host.remove();
    }
    document.body.classList.remove('summaryse-backdrop-added');
  }

  function calculateStats() {
    const wordCount = text.split(/\s+/).length;
    const summaryWordCount = currentSummary.split(/\s+/).length;
    const reduction = Math.round(((wordCount - summaryWordCount) / wordCount) * 100);
    return { wordCount, summaryWordCount, reduction };
  }

  $: stats = phase === 'complete' ? calculateStats() : null;
</script>

<div class="summaryse-widget">
  <Header
    {summaryStyle}
    onStyleChange={(style) => (summaryStyle = style)}
    onCopy={copy}
    onReset={reset}
    onClose={closeWidget}
    canCopy={phase === PHASES.COMPLETE && currentSummary}
    {chunks}
    {currentChunkIndex}
    {phase}
    isLargeText={isLargeTextFlag}
  />

  <ContentArea>
    {#if phase === PHASES.INIT || phase === PHASES.LOADING_MODEL}
      <LoadingState {loadingProgress} isFirstUse={!modelLoaded} />
    {:else if phase === PHASES.SUMMARIZING || phase === PHASES.STREAMING}
      {#if isLargeTextFlag}
        {#each chunks as chunk, i (i)}
          {#if chunkSummaries[i] === '' && !slidingOut}
            <SkeletonCard key={`skeleton-${i}`} />
          {/if}
          {#if chunkSummaries[i] !== ''}
            <ChunkCard
              summary={chunkSummaries[i]}
              isStreaming={i === currentChunkIndex && phase === PHASES.STREAMING}
              index={i}
              class={slidingOut ? 'slide-out-left' : ''}
            />
          {/if}
        {/each}

        {#if slidingOut && currentChunkIndex >= chunks.length}
          <SynthesizingCard />
        {/if}
      {:else}
        <ChunkCard
          summary={currentSummary}
          isStreaming={phase === PHASES.STREAMING}
          index={0}
        />
      {/if}
    {:else if phase === PHASES.COMPLETE}
      {#if isLargeTextFlag && !slidingOut}
        {#each chunks as chunk, i (i)}
          <ChunkCard
            summary={chunkSummaries[i]}
            isStreaming={false}
            index={i}
            class="slide-in-right"
          />
        {/each}
      {/if}

      <FinalSummaryCard {currentSummary} bind:modalOpen />

      {#if stats}
        <StatsCard {stats} />
      {/if}
    {:else if phase === PHASES.ERROR}
      <ErrorCard {errorMessage} onRetry={reset} />
    {/if}
  </ContentArea>
</div>

{#if modalOpen}
  <Modal {currentSummary} onClose={() => (modalOpen = false)} />
{/if}

<style>
  :global(body.summaryse-backdrop-added::before) {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    background:
      linear-gradient(225deg, rgba(30, 41, 59, 0.06) 0%, rgba(163, 233, 230, 0.04) 20%, transparent 45%),
      radial-gradient(ellipse 30% 35% at 100% 0%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.85) 35%);
    background-blend-mode: screen;
    animation: tealonFlow 10s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    pointer-events: none;
    z-index: -1;
  }

  @keyframes tealonFlow {
    0% {
      background: linear-gradient(225deg, rgba(30, 41, 59, 0.06) 0%, rgba(163, 233, 230, 0.04) 20%, transparent 45%);
    }
    25% {
      background: linear-gradient(225deg, rgba(30, 41, 59, 0.08) 0%, rgba(163, 233, 230, 0.06) 20%, transparent 45%);
    }
    50% {
      background: linear-gradient(225deg, rgba(30, 41, 59, 0.05) 0%, rgba(163, 233, 230, 0.03) 20%, transparent 45%);
    }
    75% {
      background: linear-gradient(225deg, rgba(30, 41, 59, 0.08) 0%, rgba(163, 233, 230, 0.05) 20%, transparent 45%);
    }
    100% {
      background: linear-gradient(225deg, rgba(30, 41, 59, 0.06) 0%, rgba(163, 233, 230, 0.04) 20%, transparent 45%);
    }
  }

  .summaryse-widget {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 520px;
    min-height: auto;
    max-height: 100vh;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    z-index: 999999;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: visible;
    gap: 16px;
    pointer-events: none;
  }

  .summaryse-widget > :global(*) {
    pointer-events: auto;
  }
</style>
