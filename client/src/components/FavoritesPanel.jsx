import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFavorites, deleteFavorite, logMeal } from '../api';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

/**
 * FavoritesPanel — shows saved favorite foods as quick-log cards.
 * Each card has a one-click "Log" button and a remove (×) button.
 *
 * Props:
 *   date   string   YYYY-MM-DD — the date to log against
 */
export default function FavoritesPanel({ date }) {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });

  // Track which favorite is being confirmed for meal type selection
  const [logging, setLogging] = useState(null); // { favorite, mealType }

  const { mutate: log, isPending: isLogging } = useMutation({
    mutationFn: logMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', date] });
      setLogging(null);
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  function handleLog(favorite, mealType) {
    log({
      date,
      meal_type: mealType,
      food_name: favorite.description,
      serving_size: `${favorite.serving_size}${favorite.serving_size_unit}`,
      calories: Number(favorite.calories),
      protein_g: Number(favorite.protein_g),
      carbs_g: Number(favorite.carbs_g),
      fat_g: Number(favorite.fat_g),
    });
  }

  if (isLoading || favorites.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
      <h2 className="font-semibold text-gray-800 mb-3 text-sm">Quick Log — Favorites</h2>

      <div className="flex flex-col gap-2">
        {favorites.map((fav) => (
          <div key={fav.id} className="flex items-center justify-between gap-3">
            {/* Food info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{fav.description}</p>
              <p className="text-xs text-gray-400">
                {fav.serving_size}{fav.serving_size_unit} —{' '}
                <span className="text-blue-600 font-medium">{Math.round(Number(fav.protein_g))}g protein</span>
                {' · '}{Math.round(Number(fav.calories))} cal
              </p>
            </div>

            {/* Log button / meal type picker */}
            <div className="shrink-0 flex items-center gap-2">
              {logging?.favorite?.id === fav.id ? (
                // Inline meal-type picker shown after tapping "Log"
                <>
                  <select
                    value={logging.mealType}
                    onChange={(e) => setLogging({ ...logging, mealType: e.target.value })}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none"
                    autoFocus
                  >
                    {MEAL_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleLog(fav, logging.mealType)}
                    disabled={isLogging}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLogging ? '…' : 'Add'}
                  </button>
                  <button
                    onClick={() => setLogging(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setLogging({ favorite: fav, mealType: 'lunch' })}
                    className="px-3 py-1 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Log
                  </button>
                  <button
                    onClick={() => remove(fav.id)}
                    title="Remove from favorites"
                    className="text-gray-200 hover:text-red-400 transition-colors text-base leading-none"
                  >
                    ★
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
