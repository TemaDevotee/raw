const http = require('http');

const port = Number(process.env.MOCK_PORT) || 3001;
const base = `http://localhost:${port}`;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    const req = http.request(base + path, opts, (res) => {
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

(async () => {
  try {
    const health = await request('GET', '/health');
    if (health.status !== 200 || !health.json.ok) throw new Error('health');
    const login = await request('POST', '/auth/login', {
      email: 'alpha@raw.dev',
      password: 'RawDev!2025',
    });
    if (login.status !== 200 || !login.json.token) throw new Error('login');
    const me = await request('GET', '/auth/me', null, login.json.token);
    if (me.status !== 200) throw new Error('me');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
