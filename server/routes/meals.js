const express = require('express');
const { getDb } = require('../db/database');
const router = express.Router();

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

/**
 * GET /api/meals?date=YYYY-MM-DD
 *
 * Returns all logged meals for a given date, grouped by meal type,
 * plus daily macro totals. Defaults to today if no date is provided.
 */
router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date || todayISO();
    const db = getDb();

    const result = await db.execute({
      sql: 'SELECT * FROM meal_logs WHERE date = ? ORDER BY created_at ASC',
      args: [date],
    });

    const rows = result.rows;

    // Group into meal-type buckets for easier consumption on the frontend
    const grouped = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    for (const row of rows) {
      grouped[row.meal_type].push(row);
    }

    res.json({ date, meals: grouped, totals: computeTotals(rows) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/meals/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns daily macro totals for each date in the range.
 * Used by the weekly trend chart (V2).
 */
router.get('/range', async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params are required' });
    }

    const db = getDb();
    const result = await db.execute({
      sql: `SELECT date,
                   SUM(calories)  AS calories,
                   SUM(protein_g) AS protein_g,
                   SUM(carbs_g)   AS carbs_g,
                   SUM(fat_g)     AS fat_g
            FROM meal_logs
            WHERE date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date ASC`,
      args: [start, end],
    });

    res.json({ range: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/meals
 *
 * Log a new food item to a meal.
 *
 * Body: { date, meal_type, food_name, serving_size, calories, protein_g, carbs_g, fat_g }
 */
router.post('/', async (req, res, next) => {
  try {
    const { date, meal_type, food_name, serving_size, calories, protein_g, carbs_g, fat_g } =
      req.body;

    if (!meal_type || !food_name || !serving_size) {
      return res.status(400).json({ error: 'meal_type, food_name, and serving_size are required' });
    }
    if (!VALID_MEAL_TYPES.includes(meal_type)) {
      return res.status(400).json({
        error: `meal_type must be one of: ${VALID_MEAL_TYPES.join(', ')}`,
      });
    }
    if ([calories, protein_g, carbs_g, fat_g].some((v) => v == null || isNaN(v))) {
      return res.status(400).json({ error: 'calories, protein_g, carbs_g, and fat_g must be numbers' });
    }

    const db = getDb();

    const insertResult = await db.execute({
      sql: `INSERT INTO meal_logs (date, meal_type, food_name, serving_size, calories, protein_g, carbs_g, fat_g)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        date || todayISO(),
        meal_type,
        food_name,
        serving_size,
        Number(calories),
        Number(protein_g),
        Number(carbs_g),
        Number(fat_g),
      ],
    });

    const created = await db.execute({
      sql: 'SELECT * FROM meal_logs WHERE id = ?',
      args: [Number(insertResult.lastInsertRowid)],
    });

    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/meals/:id
 *
 * Remove a logged meal entry by ID.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: 'DELETE FROM meal_logs WHERE id = ?',
      args: [req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Meal log entry not found' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function computeTotals(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.calories += Number(row.calories);
      acc.protein_g += Number(row.protein_g);
      acc.carbs_g += Number(row.carbs_g);
      acc.fat_g += Number(row.fat_g);
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

module.exports = router;
