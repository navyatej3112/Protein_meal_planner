import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMeal } from '../api';

/**
 * MealSection — renders a single meal type (e.g. "Breakfast") with its logged items.
 *
 * Props:
 *   title   string    e.g. "Breakfast"
 *   items   array     meal log rows for this meal type
 *   date    string    YYYY-MM-DD, needed to invalidate the correct query
 */
export default function MealSection({ title, items, date }) {
  const queryClient = useQueryClient();

  const { mutate: remove } = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', date] });
    },
  });

  const sectionTotal = items.reduce((sum, item) => sum + Number(item.protein_g), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 capitalize">{title}</h3>
        {items.length > 0 && (
          <span className="text-sm text-gray-500">
            {Math.round(sectionTotal)}g protein
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400 italic">Nothing logged yet</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.food_name}</p>
                <p className="text-xs text-gray-400">{item.serving_size}</p>
              </div>
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <div className="text-right text-sm">
                  <span className="font-semibold text-blue-600">{Math.round(Number(item.protein_g))}g</span>
                  <span className="text-gray-400 ml-1">protein</span>
                  <span className="text-gray-300 mx-1">·</span>
                  <span className="text-gray-500">{Math.round(Number(item.calories))} cal</span>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  title="Remove"
                  aria-label={`Remove ${item.food_name}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
