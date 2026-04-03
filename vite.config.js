import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          howler: ['howler'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
