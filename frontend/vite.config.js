import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Pre-generate gzip sidecar files — served by nginx/CDN without runtime overhead
    compression({ algorithm: 'gzip', ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  define: {
    global: 'window',
  },
  build: {
    // Suppress warnings on vendor chunks that are intentionally large
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Core React runtime — loaded on every page ──────────────────
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')) {
            return 'vendor-react'
          }
          // ── Data-fetching layer ────────────────────────────────────────
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query'
          }
          // ── Charts — only needed on analytics pages ────────────────────
          if (id.includes('node_modules/recharts') ||
            id.includes('node_modules/victory') ||
            id.includes('node_modules/d3')) {
            return 'vendor-charts'
          }
          // ── Drag-and-drop — only needed on board/backlog ───────────────
          if (id.includes('node_modules/@dnd-kit/')) {
            return 'vendor-dnd'
          }
          // ── Workflow canvas — only needed on WorkflowBuilderPage ───────
          if (id.includes('node_modules/reactflow') ||
            id.includes('node_modules/@reactflow/') ||
            id.includes('node_modules/elkjs')) {
            return 'vendor-flow'
          }
          // ── Misc UI utilities — icons, headless, forms ─────────────────
          if (id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/react-icons') ||
            id.includes('node_modules/@headlessui/') ||
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform/') ||
            id.includes('node_modules/zod')) {
            return 'vendor-ui'
          }
        },
      },
    },
  },
})
