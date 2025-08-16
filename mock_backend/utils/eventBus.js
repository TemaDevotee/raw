const tenantMap = new Map(); // tenantId -> { subs:Set<fn>, events:[], lastId:number }

function ensure(tenantId) {
  if (!tenantMap.has(tenantId)) tenantMap.set(tenantId, { subs: new Set(), events: [], lastId: 0 });
  return tenantMap.get(tenantId);
}

function subscribe(tenantId, fn, lastId = 0) {
  const state = ensure(tenantId);
  state.subs.add(fn);
  state.events.filter(e => e.id > lastId).forEach(fn);
}

function unsubscribe(tenantId, fn) {
  const state = tenantMap.get(tenantId);
  if (!state) return;
  state.subs.delete(fn);
  if (state.subs.size === 0) tenantMap.delete(tenantId);
}

function emit(tenantId, event) {
  const state = ensure(tenantId);
  const id = ++state.lastId;
  const evt = { id, tenantId, ts: Date.now(), ...event };
  state.events.push(evt);
  if (state.events.length > 100) state.events.shift();
  for (const fn of state.subs) {
    try { fn(evt); } catch (e) { /* ignore */ }
  }
}

module.exports = { subscribe, unsubscribe, emit };
