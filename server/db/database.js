const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'meals.db');

let client = null;

/**
 * Returns the initialized libsql client (singleton).
 * Must call initDb() once at server startup before using this.
 */
function getDb() {
  if (!client) throw new Error('Database not initialized. Call initDb() first.');
  return client;
}

/**
 * Creates the database file and runs the schema migrations.
 * Safe to call multiple times — all statements use CREATE IF NOT EXISTS.
 */
async function initDb() {
  if (client) return client;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  client = createClient({ url: `file:${DB_PATH}` });

  // Execute each schema statement individually (libsql doesn't accept multi-statement strings)
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      protein_g INTEGER NOT NULL DEFAULT 150,
      calories INTEGER NOT NULL DEFAULT 2000,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `INSERT OR IGNORE INTO goals (id, protein_g, calories) VALUES (1, 150, 2000)`,
    `CREATE TABLE IF NOT EXISTS meal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      serving_size TEXT NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ];

  for (const sql of schemaStatements) {
    await client.execute(sql);
  }

  return client;
}

module.exports = { getDb, initDb };
