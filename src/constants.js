// Message types for chrome.runtime communication
export const MESSAGE_TYPES = {
  LOAD_MODEL: 'LOAD_MODEL',
  SUMMARIZE: 'SUMMARIZE',
  PROGRESS: 'PROGRESS',
  TOKEN: 'TOKEN',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
  READY: 'READY'
};

// Timeout constants
export const TIMEOUTS = {
  REQUEST_MS: 5 * 60 * 1000, // 5 minutes
  MODEL_LOAD_MS: 600000, // 10 minutes
};

// Inference retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 8000
};

// Token batching configuration (Widget streaming)
export const STREAMING_CONFIG = {
  BATCH_DELAY_MS: 50
};
