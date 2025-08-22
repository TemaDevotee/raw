import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('../../', import.meta.url))
  const env = loadEnv(mode, rootDir, '')
  const appPort = Number(env.APP_PORT) || 5173
  const mockPort = Number(env.MOCK_PORT) || 3001

  return {
    root: rootDir,
    base: '/',
    plugins: [vue()],
    server: {
      host: true,
      port: appPort,
      cors: true,
      proxy: {
        '/api': {
          target: `http://localhost:${mockPort}`,
          changeOrigin: true,
        },
        '/auth': {
          target: `http://localhost:${mockPort}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: appPort,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url)),
      },
    },
  }
})
