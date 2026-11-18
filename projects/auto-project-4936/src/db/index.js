```js
/**
 * ─── Database Connection ───
 * Creates and exports the Drizzle ORM instance with better-sqlite3.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const config = require('../config');
const schema = require('./schema');

// Ensure data directory exists
const dbDir = path.dirname(path.resolve(config.dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite connection
const sqlite = new Database(path.resolve(config.dbPath));

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');
// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle instance with schema
const db = drizzle(sqlite, { schema });

module.exports = { db, sqlite };
```