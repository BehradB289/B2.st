```js
/**
 * ─── LinkBox Migration Script ───
 * Creates all tables and indexes using raw SQL.
 * Run: npm run migrate
 *
 * Idempotent — safe to run multiple times (IF NOT EXISTS).
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('../config');

const SQL = `
-- ═══════════════════════════════════════
-- LinkBox Schema v1.0
-- ═══════════════════════════════════════

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ─── Users ───
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT    UNIQUE NOT NULL,
  password_hash   TEXT    NOT NULL,
  username        TEXT    UNIQUE NOT NULL,
  display_name    TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  plan            TEXT    DEFAULT 'free',
  created_at      INTEGER DEFAULT (unixepoch())
);

-- ─── Links ───
CREATE TABLE IF NOT EXISTS links (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url    TEXT    NOT NULL,
  short_code      TEXT    UNIQUE NOT NULL,
  title           TEXT,
  icon            TEXT,
  position        INTEGER DEFAULT 0,
  is_active       INTEGER DEFAULT 1,
  click_count     INTEGER DEFAULT 0,
  created_at      INTEGER DEFAULT (unixepoch())
);

-- ─── Clicks ───
CREATE TABLE IF NOT EXISTS clicks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id         INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  ip_hash         TEXT,
  country         TEXT,
  device          TEXT,
  referrer        TEXT,
  timestamp       INTEGER DEFAULT (unixepoch())
);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_links_short_code
  ON links(short_code);

CREATE INDEX IF NOT EXISTS idx_links_user_id
  ON links(user_id);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id_timestamp
  ON clicks(link_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_users_username
  ON users(username);
`;

function migrate() {
  // Ensure data directory exists
  const dbDir = path.dirname(path.resolve(config.dbPath));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(path.resolve(config.dbPath));
  sqlite.pragma('journal_mode = WAL');

  console.log('🔄 Running LinkBox migrations...');
  console.log(`   Database: ${path.resolve(config.dbPath)}`);

  sqlite.exec(SQL);

  // Verify tables were created
  const tables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);

  console.log(`✅ Migration complete. Tables: [${tables.join(', ')}]`);

  // Show index count
  const indexes = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
    .all();
  console.log(`📇 Indexes created: ${indexes.length}`);

  sqlite.close();
}

// Run if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
```