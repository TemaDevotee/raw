import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  root: 'apps/simulator-studio',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
      '@studio': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5199,
    cors: true
  },
  preview: { port: 5199 }
})
