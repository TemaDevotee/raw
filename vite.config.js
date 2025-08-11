import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Serve assets from root to avoid incorrect MIME types in production
  base: '/',
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.MOCK_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
