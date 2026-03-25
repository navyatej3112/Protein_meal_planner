const express = require('express');
const { getDb } = require('../db/database');
const router = express.Router();

/**
 * GET /api/goals
 *
 * Returns the current daily nutrition goals.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM goals WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/goals
 *
 * Update the daily nutrition goals.
 * Body: { protein_g, calories }  (both optional — omit to keep current value)
 */
router.put('/', async (req, res, next) => {
  try {
    const { protein_g, calories } = req.body;

    if (protein_g !== undefined && (isNaN(protein_g) || Number(protein_g) <= 0)) {
      return res.status(400).json({ error: 'protein_g must be a positive number' });
    }
    if (calories !== undefined && (isNaN(calories) || Number(calories) <= 0)) {
      return res.status(400).json({ error: 'calories must be a positive number' });
    }

    const db = getDb();

    // Fetch current values so we can merge partial updates
    const current = await db.execute('SELECT * FROM goals WHERE id = 1');
    const currentGoal = current.rows[0];

    const updated = {
      protein_g: protein_g !== undefined ? Number(protein_g) : Number(currentGoal.protein_g),
      calories: calories !== undefined ? Number(calories) : Number(currentGoal.calories),
    };

    await db.execute({
      sql: `UPDATE goals SET protein_g = ?, calories = ?, updated_at = datetime('now') WHERE id = 1`,
      args: [updated.protein_g, updated.calories],
    });

    const result = await db.execute('SELECT * FROM goals WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
