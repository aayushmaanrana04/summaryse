import esbuild from 'esbuild';

// Build webllm-module.js bundle for browser
await esbuild.build({
  entryPoints: ['webllm-module.js'],
  bundle: true,
  format: 'esm',
  outfile: 'webllm-bundle.js',
  platform: 'browser',
  target: 'es2020',
  external: [],
  logLevel: 'info',
});

// Build ai-worker.js bundle for browser
await esbuild.build({
  entryPoints: ['ai-worker.js'],
  bundle: true,
  format: 'esm',
  outfile: 'ai-worker-bundle.js',
  platform: 'browser',
  target: 'es2020',
  external: [],
  logLevel: 'info',
});

console.log('✅ Build complete!');
