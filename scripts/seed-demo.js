const url = 'http://localhost:5174/admin/dev/seed?fresh=1';
const key = process.env.VITE_ADMIN_KEY || 'dev-admin-key';
fetch(url, { method: 'POST', headers: { 'X-Admin-Key': key } })
  .then(r => r.text())
  .then(t => { try { console.log(JSON.parse(t)); } catch { console.log(t); } })
  .catch(e => { console.error(e); process.exit(1); });
