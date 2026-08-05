import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split heavy vendors into their own chunks so the initial load is smaller
    // and browsers can cache them independently. (rolldown requires function form)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase'
            if (id.includes('react') || id.includes('scheduler')) return 'react'
          }
        },
      },
    },
    // App's single-bundle is ~165KB gzip; raise the warning threshold so the
    // build log stays clean (the split chunks are well under this).
    chunkSizeWarningLimit: 700,
  },
})
