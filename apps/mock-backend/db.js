import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const ROOT = path.resolve('.mockdb');
const SNAPSHOT_DIR = path.join(ROOT, 'snapshots');
const JOURNAL_FILE = path.join(ROOT, 'journal.json');
const AUTOSAVE_FILE = path.join(ROOT, 'autosave.json');

fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

export const state = {
  tenants: [],
  chats: [],
  messages: [],
  drafts: []
};

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
  state.tenants = data.tenants || [];
  state.chats = data.chats || [];
  state.messages = data.messages || [];
  state.drafts = data.drafts || [];
}

export function listSnapshots() {
  return fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.json')).sort();
}

export function resetState() {
  state.tenants = [];
  state.chats = [];
  state.messages = [];
  state.drafts = [];
  for (let i = 1; i <= 3; i++) {
    const tenantId = 't' + i;
    state.tenants.push({ id: tenantId, name: `Tenant ${i}` });
    const chatId = nanoid();
    state.chats.push({ id: chatId, tenantId, title: `Chat ${i}`, createdAt: Date.now() });
  }
  journal = [];
  persistJournal();
  queueAutosave();
}

export function setAutosave(enabled) {
  autosaveEnabled = !!enabled;
  if (!autosaveEnabled) {
    clearTimeout(autosaveTimer);
  }
  return autosaveEnabled;
}
