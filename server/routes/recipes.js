const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Ingredients that are strong protein sources — used for "high protein" scoring
const PROTEIN_KEYWORDS = [
  'chicken', 'beef', 'turkey', 'tuna', 'salmon', 'shrimp', 'prawn',
  'egg', 'eggs', 'pork', 'lamb', 'steak', 'cod', 'tilapia', 'tofu',
  'lentil', 'chickpea', 'black bean', 'kidney bean', 'edamame',
  'cottage cheese', 'greek yogurt', 'whey', 'tempeh', 'seitan',
];

/**
 * GET /api/recipes/search?q=chicken
 *
 * Searches TheMealDB and returns meals annotated with a protein score
 * (count of recognized protein-rich ingredients). Results are sorted
 * highest-protein-score first.
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const url = `${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheMealDB responded with status ${response.status}`);
    }

    const data = await response.json();
    const meals = data.meals || [];

    const results = meals
      .map((meal) => {
        const ingredients = extractIngredients(meal);
        const proteinScore = scoreProtein(ingredients);
        return {
          id: meal.idMeal,
          name: meal.strMeal,
          category: meal.strCategory,
          area: meal.strArea,
          thumbnail: meal.strMealThumb,
          tags: meal.strTags ? meal.strTags.split(',').map((t) => t.trim()) : [],
          ingredients,
          proteinScore,
          isHighProtein: proteinScore >= 1,
          youtubeUrl: meal.strYoutube || null,
          instructions: meal.strInstructions || '',
        };
      })
      // Sort: high-protein recipes first, then alphabetically
      .sort((a, b) => b.proteinScore - a.proteinScore || a.name.localeCompare(b.name));

    res.json({ recipes: results, total: results.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/recipes/:id
 *
 * Fetch a single recipe by TheMealDB ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const url = `${MEALDB_BASE}/lookup.php?i=${req.params.id}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`TheMealDB responded with status ${response.status}`);

    const data = await response.json();
    if (!data.meals) return res.status(404).json({ error: 'Recipe not found' });

    const meal = data.meals[0];
    const ingredients = extractIngredients(meal);

    res.json({
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      thumbnail: meal.strMealThumb,
      tags: meal.strTags ? meal.strTags.split(',').map((t) => t.trim()) : [],
      ingredients,
      proteinScore: scoreProtein(ingredients),
      youtubeUrl: meal.strYoutube || null,
      instructions: meal.strInstructions || '',
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * TheMealDB stores ingredients as strIngredient1..strIngredient20 with
 * corresponding strMeasure1..strMeasure20. Extract them into a clean array.
 */
function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({ name: name.trim(), measure: (measure || '').trim() });
    }
  }
  return ingredients;
}

/**
 * Count how many of the recipe's ingredients are recognized protein sources.
 * Returns an integer score (0 = no protein sources, 3+ = very high protein).
 */
function scoreProtein(ingredients) {
  return ingredients.filter(({ name }) => {
    const lower = name.toLowerCase();
    return PROTEIN_KEYWORDS.some((kw) => lower.includes(kw));
  }).length;
}

module.exports = router;
