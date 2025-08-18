import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { seedDemo } from '../seed/demoTenants.js';

try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {}

const ADMIN_KEY = process.env.VITE_ADMIN_KEY || 'dev_admin_key';
const baseURL = process.env.VITE_API_BASE || 'http://localhost:3001';

async function reseedOnline() {
  const res = await fetch(`${baseURL}/admin/dev/reseed`, {
    method: 'POST',
    headers: { 'X-Admin-Key': ADMIN_KEY },
  });
  if (!res.ok) throw new Error('HTTP error');
  return res.json();
}

async function reseedOffline() {
  const result = seedDemo(db, { writeFiles: true });
  const snapDir = path.resolve('.mockdb/snapshots');
  fs.mkdirSync(snapDir, { recursive: true });
  const file = path.join(snapDir, 'demo.json');
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
  return { offline: true, snapshot: file, ...result };
}

(async () => {
  try {
    const data = await reseedOnline();
    console.log('Reseeded via HTTP');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    const data = await reseedOffline();
    console.log('Server unreachable, seeded offline');
    console.log(JSON.stringify(data, null, 2));
  }
})();
