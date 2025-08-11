const fs = require('fs');
const path = require('path');

/*
 * Centralised helper for reading and writing the mock database.  All
 * endpoints should use these functions to persist data.  To avoid
 * modifying the original JSON on first load the `ensureScopes`
 * function adds workspace scaffolding (workspaces, chatsByWs,
 * teamsByWs, connectionsByWs, bots and knowledge) if they don't
 * already exist.  This allows existing data files to work without
 * changes while providing per‑workspace isolation when requested.
 */

const dbPath = path.join(__dirname, '..', 'db.json');

function readDb() {
  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

/**
 * Ensure that the provided database object contains all of the
 * workspace‑scoped collections.  If they are missing a default
 * workspace is created and the top‑level chats array (if present)
 * becomes the chat list for that workspace.  This function mutates
 * the input object and returns it for convenience.
 *
 * @param {Object} db The raw database object loaded from db.json
 * @returns {Object} The same object with workspace scaffolding ensured
 */
function ensureScopes(db) {
  // Initialise workspaces list if missing
  if (!Array.isArray(db.workspaces)) {
    db.workspaces = [];
  }
  // Determine if a default workspace already exists
  let defaultWs = db.workspaces.find((w) => w.isDefault);
  if (!defaultWs) {
    defaultWs = {
      id: 'ws-' + Date.now(),
      name: 'Default Workspace',
      createdAt: Date.now(),
      isDefault: true,
    };
    db.workspaces.push(defaultWs);
  }
  // Prepare scoped containers if missing
  if (!db.chatsByWs || typeof db.chatsByWs !== 'object') {
    db.chatsByWs = {};
  }
  if (!db.teamsByWs || typeof db.teamsByWs !== 'object') {
    db.teamsByWs = {};
  }
  if (!db.connectionsByWs || typeof db.connectionsByWs !== 'object') {
    db.connectionsByWs = {};
  }
  if (!db.membershipsByWs || typeof db.membershipsByWs !== 'object') {
    db.membershipsByWs = {};
  }
  if (!db.presence || typeof db.presence !== 'object') {
    db.presence = {};
  }
  if (!db.chatDrafts || typeof db.chatDrafts !== 'object') {
    db.chatDrafts = {};
  }
  // Copy top‑level chats into default workspace if none exist
  if (!Array.isArray(db.chatsByWs[defaultWs.id])) {
    db.chatsByWs[defaultWs.id] = Array.isArray(db.chats) ? JSON.parse(JSON.stringify(db.chats)) : [];
  }
  // Ensure teams and connections arrays exist for default workspace
  if (!Array.isArray(db.teamsByWs[defaultWs.id])) {
    db.teamsByWs[defaultWs.id] = [];
  }
  if (!Array.isArray(db.connectionsByWs[defaultWs.id])) {
    db.connectionsByWs[defaultWs.id] = [];
  }
  // Shared bots and knowledge
  if (!Array.isArray(db.bots)) {
    db.bots = [];
  }

  // Users collection for auth (mock).  Default user: app / 123qweQWE!@#
  if (!Array.isArray(db.users) || db.users.length === 0) {
    db.users = [{
      id: 1,
      username: 'app',
      email: 'app@example.com',
      name: 'App User',
      password: '123qweQWE!@#' // mock only
    }];
  }
  if (!Array.isArray(db.knowledge)) {
    db.knowledge = [];
  }
  if (!Array.isArray(db.knowledgeCollections)) {
    db.knowledgeCollections = [];
  }
  if (!Array.isArray(db.knowledgeSources)) {
    db.knowledgeSources = [];
  }
  return db;
}

module.exports = { readDb, writeDb, ensureScopes };