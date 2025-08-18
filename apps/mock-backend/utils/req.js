export function getQuery(req) {
  return req && typeof req.query === 'object' ? req.query : {};
}

export function getBody(req) {
  return req && typeof req.body === 'object' ? req.body : {};
}

export function toNumber(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function toBool(v, def = false) {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return def;
}

export function reqId(req) {
  const params = req && req.params ? req.params : {};
  const q = getQuery(req);
  return params.id !== undefined ? params.id : q.id;
}
