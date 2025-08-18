const { spawn } = require('child_process');
const http = require('http');

const base = 'http://localhost:3001';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 },
    };
    const req = http.request(base + path, options, (res) => {
      let buf = '';
      res.on('data', (d) => (buf += d));
      res.on('end', () => {
        try {
          const json = JSON.parse(buf || '{}');
          resolve({ status: res.statusCode, json });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  // seed demo data
  try {
    require('child_process').execSync('node apps/mock-backend/scripts/seed.demo.js', {
      stdio: 'ignore',
    });
  } catch (e) {
    console.error('seeding failed');
    process.exit(1);
  }
  const proc = spawn('node', ['apps/mock-backend/server.js'], {
    stdio: 'ignore',
    env: process.env,
  });
  // wait for server to start
  let ok = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await request('GET', '/health');
      if (res.status === 200 && res.json.ok) {
        ok = true;
        break;
      }
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ok) {
    proc.kill();
    console.error('health check failed');
    process.exit(1);
  }
  try {
    const login = await request('POST', '/auth/login', {
      email: 'alpha@raw.dev',
      password: 'RawDev!2025',
    });
    if (login.status !== 200 || !login.json.token) throw new Error('login failed');
    proc.kill();
    process.exit(0);
  } catch (e) {
    proc.kill();
    console.error(e.message);
    process.exit(1);
  }
}

run();
