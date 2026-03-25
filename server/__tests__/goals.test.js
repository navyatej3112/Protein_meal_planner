/**
 * Integration tests for /api/goals
 */

jest.mock('../db/database', () => {
  const { createClient } = require('@libsql/client');

  let client = null;

  async function initDb() {
    if (client) return client;

    client = createClient({ url: ':memory:' });

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

  function getDb() {
    if (!client) throw new Error('Database not initialized');
    return client;
  }

  return { initDb, getDb };
});

let app;
beforeAll(async () => {
  const { initDb } = require('../db/database');
  await initDb();
  app = require('../index').app;
});

const request = require('supertest');

describe('GET /api/goals', () => {
  it('returns the default goal row', async () => {
    const res = await request(app).get('/api/goals');

    expect(res.status).toBe(200);
    expect(Number(res.body.protein_g)).toBe(150);
    expect(Number(res.body.calories)).toBe(2000);
  });
});

describe('PUT /api/goals', () => {
  it('updates protein_g and returns the new goal', async () => {
    const res = await request(app).put('/api/goals').send({ protein_g: 180 });

    expect(res.status).toBe(200);
    expect(Number(res.body.protein_g)).toBe(180);
  });

  it('preserves unchanged fields on partial update', async () => {
    await request(app).put('/api/goals').send({ protein_g: 160, calories: 2200 });

    const res = await request(app).put('/api/goals').send({ protein_g: 200 });

    expect(Number(res.body.protein_g)).toBe(200);
    expect(Number(res.body.calories)).toBe(2200); // unchanged
  });

  it('returns 400 for non-positive protein_g', async () => {
    const res = await request(app).put('/api/goals').send({ protein_g: -10 });
    expect(res.status).toBe(400);
  });
});
