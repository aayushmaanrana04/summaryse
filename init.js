// Initialize WebLLM and popup
(async function() {
  try {
    // WebLLM is loaded as a script tag, access from window
    const webllm = window.mlc || window.webllm || window.MLCEngine;

    console.log("[init] WebLLM loaded: ✅");
    console.log("[init] Window.mlc:", window.mlc ? "✅" : "undefined");
    console.log("[init] Window.webllm:", window.webllm ? "✅" : "undefined");

    // Try to find the actual exports
    const { CreateMLCEngine, prebuiltAppConfig } = window.mlc || {};
    console.log("[init] CreateMLCEngine available:", CreateMLCEngine ? "✅" : "❌");
    console.log("[init] prebuiltAppConfig available:", prebuiltAppConfig ? "✅" : "❌");
    if (prebuiltAppConfig) {
      console.log("[init] Available models:", prebuiltAppConfig.model_list.length);
      const smollmModels = prebuiltAppConfig.model_list.filter(m => m.model_id.includes('SmolLM2'));
      console.log("[init] SmolLM2 models:", smollmModels.map(m => m.model_id).join(", "));
    }

    // Initialize popup after WebLLM is ready
    await import('./popup.js');
  } catch (error) {
    console.error("Failed to initialize:", error);
    document.body.innerHTML = `<div style="padding: 20px; color: #d32f2f;">Error: ${error.message}</div>`;
  }
})();
