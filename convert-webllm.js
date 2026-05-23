// Convert ESM web-llm.js to script-compatible format
const fs = require('fs');
const path = require('path');

const filePath = '/Users/aayushmaanrana/personal/summaryse/web-llm.js';
let code = fs.readFileSync(filePath, 'utf8');

// Remove ES6 import/export statements
code = code
  .replace(/^export\s+(?:default\s+)?/gm, '') // export default, export 
  .replace(/^import\s+[^;]+from\s+['"][^'"]+['"];?/gm, '') // import statements
  .replace(/export\s*\{[^}]+\}/gm, ''); // export { ... }

// Wrap in IIFE that sets window.mlc
const wrapped = `
(function(global) {
  const module = { exports: {} };
  const exports = module.exports;
  
  ${code}
  
  // Expose to window
  if (module.exports) {
    global.mlc = module.exports;
  } else if (exports && Object.keys(exports).length > 0) {
    global.mlc = exports;
  } else {
    // Try to find MLCEngine or other exports
    for (const key in global) {
      if (key.includes('mlc') || key.includes('MLC')) {
        global.mlc = global[key];
        break;
      }
    }
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
`;

fs.writeFileSync(filePath, wrapped);
console.log('✅ Converted web-llm.js to script-compatible format');
