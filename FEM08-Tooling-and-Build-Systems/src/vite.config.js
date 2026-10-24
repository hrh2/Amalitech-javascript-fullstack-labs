import { defineConfig } from 'vite';

// See: https://vite.dev/config/
export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true,
  },
  server: {
    port: 5173,
    open: false,
  },
});
