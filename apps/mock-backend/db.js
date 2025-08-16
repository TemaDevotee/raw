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
}

export function listSnapshots() {
  return fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.json')).sort();
}


  journal = [];
  persistJournal();
  queueAutosave();
}

}
