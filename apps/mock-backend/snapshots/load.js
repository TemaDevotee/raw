import axios from 'axios';

const base = `http://localhost:${process.env.PORT || 5174}`;
const key = process.env.VITE_ADMIN_KEY || 'dev-admin-key';
const name = process.argv[2];

if (!name) {
  console.error('Usage: node load.js <snapshot-name>');
  process.exit(1);
}

axios.post(`${base}/admin/db/load`, { name }, { headers: { 'X-Admin-Key': key } })
  .then(res => console.log(res.data))
  .catch(err => { console.error(err.response?.data || err.message); process.exit(1); });
