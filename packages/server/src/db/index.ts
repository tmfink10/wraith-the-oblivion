import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'wraith.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    player TEXT NOT NULL,
    concept TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    storyteller_id TEXT REFERENCES users(id),
    description TEXT NOT NULL DEFAULT '',
    invite_code TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaign_characters (
    campaign_id TEXT NOT NULL REFERENCES campaigns(id),
    character_id TEXT NOT NULL REFERENCES characters(id),
    PRIMARY KEY (campaign_id, character_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES campaigns(id),
    name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'multiplayer',
    state TEXT NOT NULL DEFAULT 'lobby',
    game_state TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    dice_data TEXT,
    timestamp TEXT NOT NULL
  );
`);

// Migration: add invite_code column to campaigns (safe for existing DBs)
try {
  sqlite.exec(`ALTER TABLE campaigns ADD COLUMN invite_code TEXT UNIQUE`);
} catch {
  // Column already exists — ignore
}

export default db;
