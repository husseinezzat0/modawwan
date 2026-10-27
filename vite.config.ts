import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'development-csp',
      apply: 'serve',
      transformIndexHtml: html => html.replace("script-src 'self';", "script-src 'self' 'unsafe-inline';"),
    },
    {
      // Production hardening: the packaged app must not allow connections to the
      // dev server websocket (Vite HMR). Only relaxed in dev (`npm run dev`).
      name: 'production-csp-tighten',
      apply: 'build',
      transformIndexHtml: html => html.replace(' ws://localhost:5173', ''),
    },
  ],
  base: './',
  root: '.',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: { ignored: ['**/scratch/**', '**/release/**', '**/build/**'] },
    port: 5173,
    strictPort: true,
  },
});
