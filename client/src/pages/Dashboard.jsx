import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMeals, getGoals } from '../api';
import MacroBar from '../components/MacroBar';
import MealSection from '../components/MealSection';
import FoodSearchModal from '../components/FoodSearchModal';
import WeeklyChart from '../components/WeeklyChart';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function Dashboard() {
  const [date, setDate] = useState(todayISO);
  const [showSearch, setShowSearch] = useState(false);

  const { data: mealData, isLoading: mealsLoading } = useQuery({
    queryKey: ['meals', date],
    queryFn: () => getMeals(date),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });

  const totals = mealData?.totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const meals = mealData?.meals ?? { breakfast: [], lunch: [], dinner: [], snacks: [] };

  // Protein ring percentage (capped at 100% for display)
  const proteinGoal = Number(goals?.protein_g ?? 150);
  const proteinPct = Math.min(Math.round((totals.protein_g / proteinGoal) * 100), 100);
  const isToday = date === todayISO();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isToday ? 'Today' : date}
          </p>
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Daily summary card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-5 mb-5">
          {/* Protein ring */}
          <div className="relative shrink-0 w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="33" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="33"
                fill="none"
                stroke={proteinPct >= 100 ? '#22c55e' : '#3b82f6'}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 33}`}
                strokeDashoffset={`${2 * Math.PI * 33 * (1 - proteinPct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold text-gray-800">{proteinPct}%</span>
            </div>
          </div>

          {/* Protein numbers */}
          <div>
            <p className="text-sm text-gray-500">Protein</p>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(totals.protein_g)}
              <span className="text-base font-normal text-gray-400">g</span>
            </p>
            <p className="text-sm text-gray-400">Goal: {proteinGoal}g</p>
          </div>

          {/* Calorie count */}
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-500">Calories</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(totals.calories)}
            </p>
            {goals?.calories && (
              <p className="text-sm text-gray-400">/ {goals.calories} goal</p>
            )}
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex flex-col gap-3">
          <MacroBar
            label="Protein"
            current={totals.protein_g}
            goal={proteinGoal}
            color="bg-blue-500"
          />
          <MacroBar
            label="Calories"
            current={totals.calories}
            goal={Number(goals?.calories ?? 2000)}
            color="bg-orange-400"
          />
          <MacroBar
            label="Carbs"
            current={totals.carbs_g}
            goal={0}   // no carb goal set — shows as grams only
            color="bg-yellow-400"
          />
          <MacroBar
            label="Fat"
            current={totals.fat_g}
            goal={0}
            color="bg-purple-400"
          />
        </div>
      </div>

      {/* Weekly protein trend chart */}
      <div className="mb-6">
        <WeeklyChart proteinGoal={proteinGoal} />
      </div>

      {/* Log Food button */}
      <button
        onClick={() => setShowSearch(true)}
        className="w-full py-2.5 mb-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Log Food
      </button>

      {/* Meal sections */}
      {mealsLoading ? (
        <p className="text-center text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {MEAL_TYPES.map((type) => (
            <MealSection
              key={type}
              title={type}
              items={meals[type] ?? []}
              date={date}
            />
          ))}
        </div>
      )}

      {/* Food search modal */}
      {showSearch && (
        <FoodSearchModal date={date} onClose={() => setShowSearch(false)} />
      )}
    </div>
  );
}
