import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use Node environment to avoid requiring jsdom.  Our tests stub
    // fetch and do not depend on the DOM.
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})