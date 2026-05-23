// WebLLM loader - ensures web-llm is available as window.mlc
window.mlcLoadPromise = (async function() {
  let attempts = 0;
  while (!window.mlc && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  if (!window.mlc) {
    console.warn('WebLLM did not load - trying alternative...');
    // If web-llm.js doesn't expose mlc, check common names
    if (window.default) window.mlc = window.default;
    if (!window.mlc) throw new Error('WebLLM not found on window');
  }
  console.log('✅ WebLLM available');
  return window.mlc;
})();
