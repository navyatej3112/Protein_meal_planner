import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGoals, updateGoals } from '../api';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });

  const [proteinGoal, setProteinGoal] = useState('');
  const [calorieGoal, setCalorieGoal] = useState('');
  const [saved, setSaved] = useState(false);

  // Populate fields once goals load
  useEffect(() => {
    if (goals) {
      setProteinGoal(String(goals.protein_g));
      setCalorieGoal(String(goals.calories));
    }
  }, [goals]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: updateGoals,
    onSuccess: (updated) => {
      queryClient.setQueryData(['goals'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    save({ protein_g: Number(proteinGoal), calories: Number(calorieGoal) });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Configure your daily nutrition goals.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Protein Goal (g)
              </label>
              <input
                type="number"
                min="1"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Common targets: 0.7–1g per lb of bodyweight, or 1.6–2.2g per kg.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Calorie Goal
              </label>
              <input
                type="number"
                min="1"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Saving…' : 'Save Goals'}
              </button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">Saved ✓</span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
