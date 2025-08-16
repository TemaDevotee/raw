import axios from 'axios';

const base = `http://localhost:${process.env.PORT || 5174}`;
const key = process.env.VITE_ADMIN_KEY || 'dev-admin-key';

axios.post(`${base}/admin/db/save`, null, { headers: { 'X-Admin-Key': key } })
  .then(res => console.log(res.data))
  .catch(err => { console.error(err.response?.data || err.message); process.exit(1); });
