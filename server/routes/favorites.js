const express = require('express');
const { getDb } = require('../db/database');
const router = express.Router();

/**
 * GET /api/favorites
 *
 * Returns all saved favorite foods, sorted by most recently added.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.execute(
      'SELECT * FROM favorites ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/favorites
 *
 * Save a food as a favorite.
 *
 * Body: { fdc_id, description, serving_size, serving_size_unit, calories, protein_g, carbs_g, fat_g }
 */
router.post('/', async (req, res, next) => {
  try {
    const { fdc_id, description, serving_size, serving_size_unit, calories, protein_g, carbs_g, fat_g } =
      req.body;

    if (!description || !serving_size || !serving_size_unit) {
      return res.status(400).json({ error: 'description, serving_size, and serving_size_unit are required' });
    }
    if ([calories, protein_g, carbs_g, fat_g].some((v) => v == null || isNaN(v))) {
      return res.status(400).json({ error: 'calories, protein_g, carbs_g, and fat_g must be numbers' });
    }

    const db = getDb();
    const insertResult = await db.execute({
      sql: `INSERT INTO favorites (fdc_id, description, serving_size, serving_size_unit, calories, protein_g, carbs_g, fat_g)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [fdc_id ?? null, description, Number(serving_size), serving_size_unit, Number(calories), Number(protein_g), Number(carbs_g), Number(fat_g)],
    });

    const created = await db.execute({
      sql: 'SELECT * FROM favorites WHERE id = ?',
      args: [Number(insertResult.lastInsertRowid)],
    });

    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/favorites/:id
 *
 * Remove a saved favorite.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: 'DELETE FROM favorites WHERE id = ?',
      args: [req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
