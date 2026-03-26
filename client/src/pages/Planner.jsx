import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMealsRange, getMeals, logMeal, deleteMeal, getGoals } from '../api';
import FoodSearchModal from '../components/FoodSearchModal';

/**
 * Planner — shows the next 7 days in a scrollable list.
 * Each day displays planned macro totals and meal entries.
 * Clicking "Add Food" on any day opens the standard FoodSearchModal
 * pre-set to that date.
 */
export default function Planner() {
  const days = getNext7Days();
  const start = days[0].date;
  const end = days[days.length - 1].date;

  // Fetch aggregate totals for the whole week in one request
  const { data: rangeData } = useQuery({
    queryKey: ['meals-range', start, end],
    queryFn: () => getMealsRange(start, end),
    staleTime: 1000 * 30,
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });

  const proteinGoal = Number(goals?.protein_g ?? 150);

  // Index range rows by date
  const totalsByDate = Object.fromEntries(
    (rangeData?.range ?? []).map((r) => [r.date, r])
  );

  // Track which day has an open food search modal
  const [addingDate, setAddingDate] = useState(null);

  // Track which day is expanded to see individual meals
  const [expandedDate, setExpandedDate] = useState(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
        <p className="text-sm text-gray-500 mt-0.5">Next 7 days — click a day to view or edit meals</p>
      </div>

      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const totals = totalsByDate[day.date];
          const protein = Number(totals?.protein_g ?? 0);
          const calories = Number(totals?.calories ?? 0);
          const pct = proteinGoal > 0 ? Math.min(Math.round((protein / proteinGoal) * 100), 100) : 0;
          const isExpanded = expandedDate === day.date;

          return (
            <div
              key={day.date}
              className={`bg-white border rounded-xl overflow-hidden transition-shadow ${
                day.isToday ? 'border-blue-300 shadow-sm' : 'border-gray-200'
              }`}
            >
              {/* Day header row */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedDate(isExpanded ? null : day.date)}
              >
                {/* Date label */}
                <div className="w-20 shrink-0">
                  <p className={`text-sm font-semibold ${day.isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                    {day.label}
                  </p>
                  <p className="text-xs text-gray-400">{day.shortDate}</p>
                </div>

                {/* Protein progress bar */}
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      {Math.round(protein)}g protein
                    </span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        pct >= 100 ? 'bg-green-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Calorie summary */}
                <div className="w-16 text-right shrink-0">
                  <p className="text-sm text-gray-600">{Math.round(calories)}</p>
                  <p className="text-xs text-gray-400">cal</p>
                </div>

                {/* Expand chevron */}
                <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Expanded meal detail */}
              {isExpanded && (
                <DayDetail
                  date={day.date}
                  proteinGoal={proteinGoal}
                  onAddFood={() => setAddingDate(day.date)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Food search modal — opens for the clicked day */}
      {addingDate && (
        <FoodSearchModal
          date={addingDate}
          onClose={() => setAddingDate(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DayDetail — expanded view showing individual meals for one day
// ---------------------------------------------------------------------------

function DayDetail({ date, proteinGoal, onAddFood }) {
  const queryClient = useQueryClient();

  const { data: mealData, isLoading } = useQuery({
    queryKey: ['meals', date],
    queryFn: () => getMeals(date),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', date] });
      // Also refresh the week-range totals
      queryClient.invalidateQueries({ queryKey: ['meals-range'] });
    },
  });

  const meals = mealData?.meals ?? { breakfast: [], lunch: [], dinner: [], snacks: [] };
  const allItems = Object.values(meals).flat();

  return (
    <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : allItems.length === 0 ? (
        <p className="text-xs text-gray-400 italic mb-3">No meals planned yet</p>
      ) : (
        <ul className="flex flex-col gap-1.5 mb-3">
          {['breakfast', 'lunch', 'dinner', 'snacks'].map((type) =>
            meals[type].map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 capitalize w-16 shrink-0">{type}</span>
                  <span className="text-gray-700 truncate">{item.food_name}</span>
                </div>
                <div className="flex items-center gap-3 ml-2 shrink-0">
                  <span className="text-blue-600 font-medium text-xs">
                    {Math.round(Number(item.protein_g))}g
                  </span>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      <button
        onClick={onAddFood}
        className="text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
      >
        + Add Food
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNext7Days() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const date = d.toISOString().split('T')[0];
    return {
      date,
      isToday: i === 0,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long' }),
      shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
}
