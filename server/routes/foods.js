const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

/**
 * GET /api/foods/search?q=chicken+breast&pageSize=10
 *
 * Proxies the USDA FoodData Central search endpoint and returns a
 * simplified list of foods with macro info per serving.
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, pageSize = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'USDA API key not configured on server' });
    }

    const url = `${USDA_BASE}/foods/search?api_key=${apiKey}&query=${encodeURIComponent(q)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS),Branded`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USDA API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Map USDA response to a leaner shape the frontend needs
    const foods = (data.foods || []).map((food) => ({
      fdcId: food.fdcId,
      description: food.description,
      brandOwner: food.brandOwner || null,
      servingSize: food.servingSize || 100,
      servingSizeUnit: food.servingSizeUnit || 'g',
      macros: extractMacros(food.foodNutrients),
    }));

    res.json({ foods, totalHits: data.totalHits });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/foods/:fdcId
 *
 * Fetch full detail for a single food item by its USDA FDC ID.
 */
router.get('/:fdcId', async (req, res, next) => {
  try {
    const { fdcId } = req.params;
    const apiKey = process.env.USDA_API_KEY;

    const url = `${USDA_BASE}/food/${fdcId}?api_key=${apiKey}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return res.status(404).json({ error: 'Food not found' });
    }
    if (!response.ok) {
      throw new Error(`USDA API responded with status ${response.status}`);
    }

    const food = await response.json();

    res.json({
      fdcId: food.fdcId,
      description: food.description,
      brandOwner: food.brandOwner || null,
      servingSize: food.servingSize || 100,
      servingSizeUnit: food.servingSizeUnit || 'g',
      macros: extractMacros(food.foodNutrients),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pull calories, protein, carbs, and fat out of the USDA nutrient array.
 * USDA uses nutrient IDs: 1008=calories, 1003=protein, 1005=carbs, 1004=fat
 */
function extractMacros(nutrients = []) {
  const NUTRIENT_IDS = {
    calories: 1008,
    protein_g: 1003,
    carbs_g: 1005,
    fat_g: 1004,
  };

  const result = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  for (const [key, id] of Object.entries(NUTRIENT_IDS)) {
    const match = nutrients.find(
      (n) => n.nutrientId === id || n.nutrient?.id === id
    );
    if (match) {
      result[key] = Math.round((match.value ?? match.amount ?? 0) * 10) / 10;
    }
  }

  return result;
}

module.exports = router;
