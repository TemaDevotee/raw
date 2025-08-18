import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(() => {
  const studioPort = Number(process.env.STUDIO_PORT) || 3000

  return {
    root: 'apps/simulator-studio',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@studio': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: true,
      port: studioPort,
      cors: true
    },
    preview: { host: true, port: studioPort }
  }
})
