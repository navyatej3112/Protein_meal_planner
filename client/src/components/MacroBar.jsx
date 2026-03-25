/**
 * MacroBar — horizontal progress bar showing current vs goal for a single macro.
 *
 * Props:
 *   label    string  e.g. "Protein"
 *   current  number  grams logged today
 *   goal     number  daily goal in grams
 *   color    string  Tailwind bg color class, e.g. "bg-blue-500"
 *   unit     string  defaults to "g"
 */
export default function MacroBar({ label, current, goal, color = 'bg-blue-500', unit = 'g' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const over = goal > 0 && current > goal;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>
          {Math.round(current)}{unit}
          {goal > 0 && ` / ${goal}${unit}`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
