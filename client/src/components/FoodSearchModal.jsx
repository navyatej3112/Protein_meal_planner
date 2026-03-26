import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchFoods, logMeal, saveFavorite, deleteFavorite, getFavorites } from '../api';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

/**
 * FoodSearchModal — search USDA foods and log a serving to a meal.
 * Also lets users star foods to save them as favorites.
 *
 * Props:
 *   date      string    YYYY-MM-DD
 *   onClose   function
 */
export default function FoodSearchModal({ date, onClose }) {
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [servingMultiplier, setServingMultiplier] = useState(1);

  // Only fires when the user explicitly submits a search
  const { data, isFetching, error } = useQuery({
    queryKey: ['food-search', submittedQuery],
    queryFn: () => searchFoods(submittedQuery),
    enabled: submittedQuery.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Load favorites so we can highlight already-starred foods
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });

  // Build a Set of fdc_ids that are currently favorited for O(1) lookup
  const favoritedFdcIds = new Set(favorites.map((f) => String(f.fdc_id)).filter(Boolean));

  const { mutate: log, isPending: isLogging } = useMutation({
    mutationFn: logMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', date] });
      onClose();
    },
  });

  const { mutate: star } = useMutation({
    mutationFn: saveFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const { mutate: unstar } = useMutation({
    mutationFn: deleteFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) setSubmittedQuery(query.trim());
  }

  function handleLog() {
    if (!selected) return;
    const m = Number(servingMultiplier);
    log({
      date,
      meal_type: mealType,
      food_name: selected.description,
      serving_size: `${m !== 1 ? `${m} × ` : ''}${selected.servingSize}${selected.servingSizeUnit}`,
      calories: selected.macros.calories * m,
      protein_g: selected.macros.protein_g * m,
      carbs_g: selected.macros.carbs_g * m,
      fat_g: selected.macros.fat_g * m,
    });
  }

  function handleToggleFavorite(e, food) {
    // Prevent the click from also selecting the row
    e.stopPropagation();

    if (favoritedFdcIds.has(String(food.fdcId))) {
      // Find the favorite row by fdc_id and delete it
      const existing = favorites.find((f) => String(f.fdc_id) === String(food.fdcId));
      if (existing) unstar(existing.id);
    } else {
      star({
        fdc_id: String(food.fdcId),
        description: food.description,
        serving_size: food.servingSize,
        serving_size_unit: food.servingSizeUnit,
        calories: food.macros.calories,
        protein_g: food.macros.protein_g,
        carbs_g: food.macros.carbs_g,
        fat_g: food.macros.fat_g,
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 text-lg">Search Foods</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. chicken breast, greek yogurt…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!query.trim() || isFetching}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? '…' : 'Search'}
            </button>
          </form>

          {/* Error state */}
          {error && <p className="text-sm text-red-500">{error.message}</p>}

          {/* Results */}
          {data?.foods && (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {data.foods.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-400 italic">No results found</li>
              ) : (
                data.foods.map((food) => {
                  const isStarred = favoritedFdcIds.has(String(food.fdcId));
                  return (
                    <li
                      key={food.fdcId}
                      onClick={() => setSelected(food)}
                      className={`flex items-start gap-2 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selected?.fdcId === food.fdcId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">{food.description}</p>
                        {food.brandOwner && (
                          <p className="text-xs text-gray-400">{food.brandOwner}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          Per {food.servingSize}{food.servingSizeUnit} —{' '}
                          <span className="font-medium text-blue-600">{food.macros.protein_g}g protein</span>
                          {' · '}{food.macros.calories} cal
                          {' · '}{food.macros.carbs_g}g carbs
                          {' · '}{food.macros.fat_g}g fat
                        </p>
                      </div>
                      {/* Star / unstar button */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, food)}
                        title={isStarred ? 'Remove from favorites' : 'Save as favorite'}
                        className={`shrink-0 text-lg leading-none mt-0.5 transition-colors ${
                          isStarred ? 'text-yellow-400 hover:text-gray-300' : 'text-gray-200 hover:text-yellow-400'
                        }`}
                      >
                        ★
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}

          {/* Log controls — only shown after selecting a food */}
          {selected && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700 truncate">{selected.description}</p>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Meal</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MEAL_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">
                    Servings (1 = {selected.servingSize}{selected.servingSizeUnit})
                  </label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={servingMultiplier}
                    onChange={(e) => setServingMultiplier(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Logging:{' '}
                <span className="font-semibold text-blue-700">
                  {Math.round(selected.macros.protein_g * servingMultiplier)}g protein
                </span>
                {' · '}{Math.round(selected.macros.calories * servingMultiplier)} cal
                {' · '}{Math.round(selected.macros.carbs_g * servingMultiplier)}g carbs
                {' · '}{Math.round(selected.macros.fat_g * servingMultiplier)}g fat
              </p>

              <button
                onClick={handleLog}
                disabled={isLogging}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLogging ? 'Logging…' : 'Log to Meal'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
