import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const studioPort = Number(env.STUDIO_PORT) || 5199

  return {
    root: 'apps/simulator-studio',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@studio': fileURLToPath(new URL('./src', import.meta.url))
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
