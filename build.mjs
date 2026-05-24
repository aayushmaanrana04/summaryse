import esbuild from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import sveltePreprocess from 'svelte-preprocess';
import fs from 'fs';
import path from 'path';

const dist = 'dist';

// Clean and create dist directory
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true });
}
fs.mkdirSync(dist, { recursive: true });
fs.mkdirSync(path.join(dist, 'pages'), { recursive: true });

// Build webllm-module.js bundle for browser
await esbuild.build({
  entryPoints: ['webllm-module.js'],
  bundle: true,
  format: 'esm',
  outfile: path.join(dist, 'webllm-bundle.js'),
  platform: 'browser',
  target: 'es2020',
  external: ['url', 'fs', 'path'],
  logLevel: 'info',
});

// Build ai-worker.js bundle for browser
await esbuild.build({
  entryPoints: ['ai-worker.js'],
  bundle: true,
  format: 'esm',
  outfile: path.join(dist, 'ai-worker-bundle.js'),
  platform: 'browser',
  target: 'es2020',
  external: ['url', 'fs', 'path'],
  logLevel: 'info',
});

// Build Svelte content widget with Tailwind CSS for content script injection
try {
  await esbuild.build({
    entryPoints: ['src/content.js'],
    bundle: true,
    outfile: path.join(dist, 'content-bundle.js'),
    format: 'iife',
    globalName: 'SummaryseContent',
    platform: 'browser',
    target: 'chrome100',
    plugins: [esbuildSvelte({
      preprocess: sveltePreprocess(),
      compilerOptions: { css: 'injected' }
    })],
    logLevel: 'info',
  });
  console.log('✅ Svelte build complete!');
} catch (error) {
  console.error('Svelte build failed:', error.message);
  process.exit(1);
}

// Build markdown worker
try {
  await esbuild.build({
    entryPoints: ['src/markdown-worker.js'],
    bundle: true,
    outfile: path.join(dist, 'markdown-worker-bundle.js'),
    format: 'iife',
    platform: 'browser',
    target: 'chrome100',
    logLevel: 'info',
  });
  console.log('✅ Markdown worker build complete!');
} catch (error) {
  console.error('Markdown worker build failed:', error.message);
  process.exit(1);
}

// Copy manifest.json to dist
fs.copyFileSync('manifest.json', path.join(dist, 'manifest.json'));

// Copy webllm-npm.js to dist
fs.copyFileSync('webllm-npm.js', path.join(dist, 'webllm-npm.js'));

// Copy pages directory to dist
for (const file of fs.readdirSync('pages')) {
  fs.copyFileSync(path.join('pages', file), path.join(dist, 'pages', file));
}

console.log('✅ All builds complete!');
