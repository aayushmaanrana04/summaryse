<script>
    import { onMount, onDestroy } from "svelte";
    import {
        estimateTokens,
        splitIntoChunks,
        isLargeText,
        isShortText,
        PHASES,
    } from "../utils.js";

    import Header from "./Header.svelte";
    import ContentArea from "./ContentArea.svelte";
    import LoadingState from "./LoadingState.svelte";
    import SkeletonCard from "./SkeletonCard.svelte";
    import ChunkCard from "./ChunkCard.svelte";
    import SynthesizingCard from "./SynthesizingCard.svelte";
    import FinalSummaryCard from "./FinalSummaryCard.svelte";
    import StatsCard from "./StatsCard.svelte";
    import ErrorCard from "./ErrorCard.svelte";
    import Modal from "./Modal.svelte";

    export let text = "";

    // State
    let phase = PHASES.INIT;
    let summaryStyle = "bullets";
    let currentSummaryTokens = [];
    let currentSummary = "";
    let modelLoaded = false;
    let isLargeTextFlag = false;
    let chunks = [];
    let chunkSummaries = [];
    let chunkTokens = [];
    let currentChunkIndex = 0;
    let finalized = false;
    let modalOpen = false;
    let loadingProgress = 0;
    let errorMessage = "";
    let slidingOut = false;
    let chunksCollapsed = false;
    let updatePending = false;

    onMount(() => {
        chrome.runtime.onMessage.addListener(handleBackgroundMessage);

        initialize();

        return () => {
            chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
        };
    });

    onDestroy(() => {
        document.body.classList.remove("summaryse-backdrop-added");
    });

    async function initialize() {
        console.log("[summaryse-widget] Initializing");

        // Check if model is already loaded
        chrome.storage.local.get("summaryse_model_ready", (result) => {
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
                chrome.runtime.sendMessage({ type: "LOAD_MODEL" });
            }
        } catch (error) {
            console.error("[summaryse-widget] Init error:", error);
            showError(`Failed to initialize: ${error.message}`);
        }
    }

    function wakeUpServiceWorker() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Service worker wake-up timeout"));
            }, 5000);

            chrome.runtime.sendMessage({ type: "PING" }, (response) => {
                clearTimeout(timeout);
                if (response) {
                    resolve();
                } else {
                    reject(new Error("No response from service worker"));
                }
            });
        });
    }

    function startSummarization() {
        console.log("[summaryse-widget] Starting summarization");
        phase = PHASES.SUMMARIZING;

        const isShortTextFlag = isShortText(text);
        isLargeTextFlag = isLargeText(text);

        if (isShortTextFlag) {
            // Short text: TL;DR mode
            console.log("[summaryse-widget] Short text detected: TL;DR mode");
            phase = PHASES.STREAMING;
            chrome.runtime.sendMessage({
                type: "SUMMARIZE",
                text: text,
                style: summaryStyle,
                isShortText: true,
            });
        } else if (isLargeTextFlag) {
            // Large text: chunk it
            chunks = splitIntoChunks(text);
            chunkSummaries = new Array(chunks.length).fill("");
            currentChunkIndex = 0;

            console.log(
                `[summaryse-widget] Large text detected: ${chunks.length} chunks`,
            );

            // Initialize with skeleton cards
            phase = PHASES.STREAMING;
            processNextChunk();
        } else {
            // Medium text: single summarization
            console.log("[summaryse-widget] Medium text detected: single summarization");
            phase = PHASES.STREAMING;
            chrome.runtime.sendMessage({
                type: "SUMMARIZE",
                text: text,
                style: summaryStyle,
            });
        }
    }

    function processNextChunk() {
        if (currentChunkIndex >= chunks.length) {
            mergeChunks();
            return;
        }

        const chunk = chunks[currentChunkIndex];
        console.log(
            `[summaryse-widget] Processing chunk ${currentChunkIndex + 1}/${chunks.length}`,
        );

        chrome.runtime.sendMessage({
            type: "SUMMARIZE",
            text: chunk.text,
            style: summaryStyle,
            chunkIndex: currentChunkIndex,
            totalChunks: chunks.length,
            isChunk: true,
        });
    }

    function mergeChunks() {
        const combined = chunkSummaries.join(" ");
        console.log("[summaryse-widget] Merging chunks for final summary");

        slidingOut = true;

        // Remove chunks from DOM after collapse animation (400ms)
        setTimeout(() => {
            chunksCollapsed = true;
        }, 420);

        setTimeout(() => {
            finalized = true;
            chrome.runtime.sendMessage({
                type: "SUMMARIZE",
                text: combined,
                style: summaryStyle,
                isFinalSummary: true,
            });
        }, 300);
    }

    function handleBackgroundMessage(message) {
        console.log("[summaryse-widget] Message received:", message.type);

        switch (message.type) {
            case "PROGRESS":
                loadingProgress = message.percent || message.progress || 0;
                break;

            case "READY":
                console.log("[summaryse-widget] Model ready");
                modelLoaded = true;
                chrome.storage.local.set({ summaryse_model_ready: true });
                startSummarization();
                break;

            case "TOKEN":
                handleToken(message);
                break;

            case "COMPLETE":
                handleComplete(message);
                break;

            case "ERROR":
                showError(message.error || "Unknown error");
                break;
        }
    }

    function handleToken(message) {
        const token = message.token || "";
        const chunkIndex = message.chunkIndex;

        if (message.isFinalSummary) {
            // Use token array builder instead of string concatenation
            currentSummaryTokens.push(token);
            if (!updatePending) {
                updatePending = true;
                setTimeout(() => {
                    currentSummary = currentSummaryTokens.join('');
                    updatePending = false;
                }, 50);
            }
        } else if (chunkIndex !== undefined) {
            // Chunk streaming - update individual chunk immediately
            if (!chunkTokens[chunkIndex]) {
                chunkTokens[chunkIndex] = [];
            }
            chunkTokens[chunkIndex].push(token);

            if (!updatePending) {
                updatePending = true;
                setTimeout(() => {
                    // Update only the chunk that received tokens
                    chunkSummaries[chunkIndex] = chunkTokens[chunkIndex]?.join('') || '';
                    chunkSummaries = chunkSummaries;
                    updatePending = false;
                }, 50);
            }
        } else {
            // Single text streaming - use token array
            currentSummaryTokens.push(token);
            if (!updatePending) {
                updatePending = true;
                setTimeout(() => {
                    currentSummary = currentSummaryTokens.join('');
                    updatePending = false;
                }, 50);
            }
        }
    }

    function handleComplete(message) {
        if (message.isFinalSummary) {
            currentSummary = message.summary || currentSummaryTokens.join('');
            currentSummaryTokens = [];
            finalized = true;
            phase = PHASES.COMPLETE;
            console.log("[summaryse-widget] Summarization complete");
        } else if (message.chunkIndex !== undefined) {
            // Chunk complete - join tokens and finalize
            chunkSummaries[message.chunkIndex] =
                message.summary || (chunkTokens[message.chunkIndex]?.join('') || '');
            chunkSummaries = chunkSummaries;

            currentChunkIndex++;
            if (currentChunkIndex < chunks.length) {
                processNextChunk();
            } else {
                mergeChunks();
            }
        } else {
            // Single text complete
            currentSummary = message.summary || currentSummaryTokens.join('');
            currentSummaryTokens = [];
            phase = PHASES.COMPLETE;
            console.log("[summaryse-widget] Summarization complete");
        }
    }

    function showError(message) {
        errorMessage = message;
        phase = PHASES.ERROR;
        console.error("[summaryse-widget]", message);
    }

    function copy() {
        if (currentSummary) {
            navigator.clipboard.writeText(currentSummary);
        }
    }

    function reset() {
        phase = PHASES.INIT;
        currentSummary = "";
        currentSummaryTokens = [];
        chunkSummaries = [];
        chunkTokens = [];
        currentChunkIndex = 0;
        finalized = false;
        slidingOut = false;
        chunksCollapsed = false;
        startSummarization();
    }

    function closeWidget() {
        const host = document.getElementById("summaryse-host");
        if (host) {
            host.remove();
        }
        document.body.classList.remove("summaryse-backdrop-added");
    }

    function calculateStats() {
        const wordCount = text.split(/\s+/).length;
        const summaryWordCount = currentSummary.split(/\s+/).length;
        const reduction = Math.round(
            ((wordCount - summaryWordCount) / wordCount) * 100,
        );
        return { wordCount, summaryWordCount, reduction };
    }

    $: stats = phase === "complete" ? calculateStats() : null;
</script>

<div class="summaryse-widget">

    <ContentArea
        isBubbleMode={phase === PHASES.STREAMING || phase === PHASES.SUMMARIZING}
        isFinalOnly={phase === PHASES.COMPLETE}
    >
        {#if phase === PHASES.INIT || phase === PHASES.LOADING_MODEL}
            <LoadingState {loadingProgress} isFirstUse={!modelLoaded} />
        {:else if phase === PHASES.SUMMARIZING || phase === PHASES.STREAMING}
            {#if isLargeTextFlag && !chunksCollapsed}
                {#each chunks as chunk, i (i)}
                    <ChunkCard
                        summary={chunkSummaries[i]}
                        isStreaming={i === currentChunkIndex &&
                            phase === PHASES.STREAMING}
                        index={i}
                        isBubble={true}
                        compactExpanded={true}
                        isCollapsing={slidingOut}
                    />
                {/each}

                {#if slidingOut && currentChunkIndex >= chunks.length}
                    <FinalSummaryCard
                        currentSummary={currentSummary}
                        isBubble={true}
                        bind:modalOpen
                        onCopy={copy}
                        onClose={closeWidget}
                    />
                {/if}
            {:else}
                <ChunkCard
                    summary={currentSummary}
                    isStreaming={phase === PHASES.STREAMING}
                    index={0}
                    isBubble={true}
                    compactExpanded={false}
                    isCollapsing={false}
                />
            {/if}
        {:else if phase === PHASES.COMPLETE}
            <FinalSummaryCard
                {currentSummary}
                isExpandedFinal={true}
                bind:modalOpen
                onCopy={copy}
                onClose={closeWidget}
            />
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
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 100vh;
        background: linear-gradient(
            to left,
            rgba(30, 41, 59, 0.2) 0%,
            rgba(30, 41, 59, 0.1) 35%,
            transparent 65%
        );
        pointer-events: none;
        z-index: -1;
    }

    :global(.summaryse-base-card) {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 20px;
        background: rgba(225, 237, 247, 0.95);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        position: relative;
        animation: cardRise 400ms cubic-bezier(0.4, 0, 0.2, 1);
        width: 650px;
        box-sizing: border-box;
        flex-shrink: 0;
        contain: layout style;
        backface-visibility: hidden;
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

    .summaryse-widget {
        position: fixed;
        top: 20px;
        right: 20px;
        width: full;
        min-height: auto;
        max-height: 100 svh;
        background: transparent;
        border-radius: 0;
        box-shadow: none;
        display: flex;
        flex-direction: column;
        z-index: 999999;
        font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        overflow: visible;
        gap: 16px;
        pointer-events: none;
    }

    .summaryse-widget > :global(*) {
        pointer-events: auto;
    }
</style>
