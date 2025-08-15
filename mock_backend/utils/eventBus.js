const tenantSubs = new Map(); // tenantId -> Set<fn>

function subscribe(tenantId, fn) {
  if (!tenantSubs.has(tenantId)) tenantSubs.set(tenantId, new Set());
  tenantSubs.get(tenantId).add(fn);
}

function unsubscribe(tenantId, fn) {
  const set = tenantSubs.get(tenantId);
  if (!set) return;
  set.delete(fn);
  if (set.size === 0) tenantSubs.delete(tenantId);
}

function emit(tenantId, event) {
  const set = tenantSubs.get(tenantId);
  if (!set) return;
  for (const fn of set) {
    try { fn(event); } catch (e) { /* ignore */ }
  }
}

module.exports = { subscribe, unsubscribe, emit };
