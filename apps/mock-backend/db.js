import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const ROOT = path.resolve('.mockdb');
const FILE_ROOT = path.join(ROOT, 'files');
const SNAPSHOT_DIR = path.join(ROOT, 'snapshots');
const JOURNAL_FILE = path.join(ROOT, 'journal.json');
const AUTOSAVE_FILE = path.join(ROOT, 'autosave.json');

fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

export const state = {
  tenants: [],
  users: [],
  agents: [],
  knowledge: [],
  chats: [],
  messages: [],
  drafts: [],
};

const tokens = new Map();
let autosaveEnabled = process.env.AUTOSAVE === '1';
let journal = [];
let autosaveTimer;

function persistJournal() {
  if (!autosaveEnabled) return;
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journal, null, 2));
}

function queueAutosave() {
  if (!autosaveEnabled) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    fs.writeFileSync(AUTOSAVE_FILE, JSON.stringify(state, null, 2));
  }, 1500);
}

export function touch(entry) {
  if (!autosaveEnabled) return;
  journal.push({ ts: Date.now(), ...entry });
  persistJournal();
  queueAutosave();
}

export function saveSnapshot(name) {
  const file = path.join(SNAPSHOT_DIR, name);
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
  return file;
}

export function loadSnapshot(name) {
  const file = path.join(SNAPSHOT_DIR, name);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(state, data);
}

export function listSnapshots() {
  return fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.json')).sort();
}

export function setAutosave(enabled) {
  autosaveEnabled = !!enabled;
  if (!autosaveEnabled) clearTimeout(autosaveTimer);
  return autosaveEnabled;
}

function reset() {
  state.tenants = [];
  state.users = [];
  state.agents = [];
  state.knowledge = [];
  state.chats = [];
  state.messages = [];
  state.drafts = [];
  journal = [];
  persistJournal();
  queueAutosave();
}

export function resetState() {
  reset();
}

export function issueToken(userId) {
  const token = nanoid();
  tokens.set(token, { userId, exp: Date.now() + 60 * 60 * 1000 });
  return token;
}

export function getUserByToken(token) {
  const info = tokens.get(token);
  if (!info || info.exp < Date.now()) return null;
  return state.users.find((u) => u.id === info.userId) || null;
}

export function seedDemoData(fresh = false) {
  if (fresh) reset();
  const summary = { tenants: 0, users: 0, agents: 0, knowledge: 0, chats: 0, messages: 0, drafts: 0 };

  function ensureTenant(data) {
    if (state.tenants.find((t) => t.id === data.id)) return;
    state.tenants.push(data); summary.tenants++;
  }
  function ensureUser(data) {
    if (state.users.find((u) => u.username === data.username)) return;
    state.users.push(data); summary.users++;
  }
  function ensureAgent(data) {
    if (state.agents.find((a) => a.id === data.id)) return;
    state.agents.push(data); summary.agents++;
  }
  function ensureKnowledge(data) {
    if (state.knowledge.find((k) => k.id === data.id)) return;
    const dir = path.join(FILE_ROOT, data.tenantId);
    fs.mkdirSync(dir, { recursive: true });
    data.files.forEach((f) => {
      const p = path.join(dir, f.name);
      if (!fs.existsSync(p)) fs.writeFileSync(p, f.content || 'demo');
      f.path = p;
    });
    data.totalSizeMb = data.files.reduce((s, f) => s + (f.size || Buffer.byteLength(f.content || 'demo')), 0) / 1e6;
    state.knowledge.push(data); summary.knowledge++;
  }
  function ensureChat(data) {
    if (state.chats.find((c) => c.id === data.id)) return;
    state.chats.push(data); summary.chats++;
  }
  function ensureMessage(data) {
    if (state.messages.find((m) => m.id === data.id)) return;
    state.messages.push(data); summary.messages++;
  }
  function ensureDraft(data) {
    if (state.drafts.find((d) => d.id === data.id)) return;
    state.drafts.push(data); summary.drafts++;
  }

  // Tenant A
  ensureTenant({
    id: 'alpha',
    name: 'alpha-shop',
    plan: 'starter',
    quotas: { tokensLimit: 20000, storageMb: 20 },
    usage: { tokensUsed: 6000, storageMb: 6 },
    createdAt: Date.now(),
  });
  ensureUser({ id: 'u_alpha', username: 'alpha', password: 'Alpha123!', role: 'owner', tenantId: 'alpha' });
  ensureAgent({ id: 'a_sales', tenantId: 'alpha', name: 'Sales Assistant', prompt: '', provider: 'mock', temperature: 0.5, tokenBudgetPerDraft: 1000 });
  ensureAgent({ id: 'a_returns', tenantId: 'alpha', name: 'Returns Helper', prompt: '', provider: 'mock', temperature: 0.5, tokenBudgetPerDraft: 1000 });
  ensureKnowledge({
    id: 'k_alpha',
    tenantId: 'alpha',
    title: 'alpha knowledge',
    files: [
      { id: 'f_alpha1', name: 'Products FAQ.pdf', size: 5 * 1024 * 1024 },
      { id: 'f_alpha2', name: 'Return Policy.md', size: 1 * 1024 * 1024 },
    ],
  });
  ensureChat({ id: 'c_alpha1', tenantId: 'alpha', title: 'Greetings', agentId: 'a_sales', createdByUserId: 'u_alpha', createdAt: Date.now() });
  ensureChat({ id: 'c_alpha2', tenantId: 'alpha', title: 'Empty chat', agentId: 'a_sales', createdByUserId: 'u_alpha', createdAt: Date.now() });
  ensureMessage({ id: 'm_alpha1', chatId: 'c_alpha1', role: 'user', text: 'Hello', createdAt: Date.now() - 1000 });
  ensureMessage({ id: 'm_alpha2', chatId: 'c_alpha1', role: 'agent', text: 'Hi there!', createdAt: Date.now() });

  // Tenant B
  ensureTenant({
    id: 'bravo',
    name: 'bravo-saas',
    plan: 'pro',
    quotas: { tokensLimit: 100000, storageMb: 200 },
    usage: { tokensUsed: 10000, storageMb: 20 },
    createdAt: Date.now(),
  });
  ensureUser({ id: 'u_bravo', username: 'bravo', password: 'Bravo123!', role: 'operator', tenantId: 'bravo' });
  ensureAgent({ id: 'a_onboard', tenantId: 'bravo', name: 'Onboarding Bot', prompt: '', provider: 'mock', temperature: 0.5, tokenBudgetPerDraft: 1000 });
  ensureKnowledge({
    id: 'k_bravo',
    tenantId: 'bravo',
    title: 'bravo knowledge',
    files: [
      { id: 'f_bravo1', name: 'Getting Started.md', size: 2 * 1024 * 1024 },
      { id: 'f_bravo2', name: 'API cheatsheet.txt', size: 1 * 1024 * 1024 },
    ],
  });
  ensureChat({ id: 'c_bravo1', tenantId: 'bravo', title: 'Chat 1', agentId: 'a_onboard', createdByUserId: 'u_bravo', createdAt: Date.now() });
  ensureChat({ id: 'c_bravo2', tenantId: 'bravo', title: 'Chat 2', agentId: 'a_onboard', createdByUserId: 'u_bravo', createdAt: Date.now() });
  ensureChat({ id: 'c_bravo3', tenantId: 'bravo', title: 'Chat 3', agentId: 'a_onboard', createdByUserId: 'u_bravo', createdAt: Date.now() });
  ensureDraft({ id: 'd_bravo1', chatId: 'c_bravo3', text: 'Pending reply', createdAt: Date.now(), status: 'pending' });
  ensureDraft({ id: 'd_bravo2', chatId: 'c_bravo3', text: 'Another draft', createdAt: Date.now(), status: 'pending' });

  // Tenant C
  ensureTenant({
    id: 'charlie',
    name: 'charlie-support',
    plan: 'basic',
    quotas: { tokensLimit: 10000, storageMb: 50 },
    usage: { tokensUsed: 9000, storageMb: 45 },
    createdAt: Date.now(),
  });
  ensureUser({ id: 'u_charlie', username: 'charlie', password: 'Charlie123!', role: 'owner', tenantId: 'charlie' });
  ensureAgent({ id: 'a_ru', tenantId: 'charlie', name: 'RU Support', prompt: '', provider: 'mock', temperature: 0.5, tokenBudgetPerDraft: 1000 });
  ensureKnowledge({
    id: 'k_charlie',
    tenantId: 'charlie',
    title: 'charlie knowledge',
    files: [
      { id: 'f_charlie1', name: 'Справка по тарифам.md', size: 4 * 1024 * 1024 },
      { id: 'f_charlie2', name: 'big.pdf', size: 40 * 1024 * 1024 },
    ],
  });
  ensureChat({ id: 'c_charlie1', tenantId: 'charlie', title: 'Support', agentId: 'a_ru', createdByUserId: 'u_charlie', createdAt: Date.now() });
  ensureMessage({ id: 'm_charlie1', chatId: 'c_charlie1', role: 'user', text: 'Помогите', createdAt: Date.now() - 1000 });
  ensureMessage({ id: 'm_charlie2', chatId: 'c_charlie1', role: 'agent', text: 'Чем могу помочь?', createdAt: Date.now() });

  return summary;
}
