import { spawn } from 'child_process'

const SPA_PORT = 5173
const MOCK_PORT = 3100

process.env.VITE_E2E = '1'
process.env.MOCK_PORT = String(MOCK_PORT)

const vite = spawn('npm', ['run', 'dev:e2e'], {
  env: process.env,
  stdio: 'inherit'
})

const mock = spawn('npm', ['run', 'mock'], {
  env: process.env,
  stdio: 'inherit'
})

async function waitFor(url) {
  for (;;) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
}

await Promise.all([
  waitFor(`http://localhost:${SPA_PORT}/`),
  waitFor(`http://localhost:${MOCK_PORT}/health`)
])

console.log('E2E_SERVERS_READY')

function shutdown(code) {
  vite.kill('SIGINT')
  mock.kill('SIGINT')
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

await new Promise(() => {})
