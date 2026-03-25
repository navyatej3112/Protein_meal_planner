/**
 * Integration tests for /api/meals
 *
 * Uses supertest to hit the real Express routes against an in-memory libsql
 * database, so no test data bleeds into the real meals.db file.
 */

const request = require('supertest');

// ---------------------------------------------------------------------------
// Swap out the real database for an in-memory one before the app loads
// ---------------------------------------------------------------------------

// We mock the database module to return an in-memory client
jest.mock('../db/database', () => {
  const { createClient } = require('@libsql/client');
  const fs = require('fs');
  const path = require('path');

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

// Load app AFTER mock is in place
let app;
beforeAll(async () => {
  const { initDb } = require('../db/database');
  await initDb();
  app = require('../index').app;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/meals', () => {
  it('returns empty grouped meals and zero totals for a date with no logs', async () => {
    const res = await request(app).get('/api/meals?date=2099-01-01');

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2099-01-01');
    expect(res.body.meals.breakfast).toEqual([]);
    expect(res.body.totals.protein_g).toBe(0);
  });
});

describe('POST /api/meals', () => {
  const validEntry = {
    date: '2099-01-01',
    meal_type: 'lunch',
    food_name: 'Chicken Breast',
    serving_size: '200g',
    calories: 330,
    protein_g: 62,
    carbs_g: 0,
    fat_g: 7.2,
  };

  it('creates a new meal log entry and returns it with an id', async () => {
    const res = await request(app).post('/api/meals').send(validEntry);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.food_name).toBe('Chicken Breast');
    expect(Number(res.body.protein_g)).toBe(62);
  });

  it('returns 400 when meal_type is invalid', async () => {
    const res = await request(app)
      .post('/api/meals')
      .send({ ...validEntry, meal_type: 'brunch' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/meal_type/);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/meals').send({ date: '2099-01-01' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/meals/:id', () => {
  it('deletes an existing entry and returns success', async () => {
    const create = await request(app).post('/api/meals').send({
      date: '2099-06-15',
      meal_type: 'snacks',
      food_name: 'Greek Yogurt',
      serving_size: '1 cup',
      calories: 130,
      protein_g: 17,
      carbs_g: 9,
      fat_g: 0.7,
    });

    const { id } = create.body;

    const del = await request(app).delete(`/api/meals/${id}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });

  it('returns 404 when entry does not exist', async () => {
    const res = await request(app).delete('/api/meals/99999');
    expect(res.status).toBe(404);
  });
});
