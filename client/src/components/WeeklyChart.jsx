import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getMealsRange } from '../api';

/**
 * WeeklyChart — bar chart showing daily protein intake for the past 7 days.
 *
 * Props:
 *   proteinGoal  number  daily protein goal in grams (for the reference line)
 */
export default function WeeklyChart({ proteinGoal }) {
  const { start, end, labels } = getLast7Days();

  const { data, isLoading } = useQuery({
    queryKey: ['meals-range', start, end],
    queryFn: () => getMealsRange(start, end),
    staleTime: 1000 * 60 * 5,
  });

  // Merge API results into the full 7-day skeleton (days with no logs = 0)
  const chartData = buildChartData(labels, data?.range ?? []);

  const avg = Math.round(
    chartData.reduce((sum, d) => sum + d.protein_g, 0) / chartData.length
  );

  const goalMet = chartData.filter((d) => d.protein_g >= proteinGoal).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">7-Day Protein</h2>
          <p className="text-xs text-gray-400 mt-0.5">Past 7 days vs goal</p>
        </div>
        {/* Summary stats */}
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-gray-400">Avg / day</p>
            <p className="text-base font-bold text-gray-800">{avg}g</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Goal met</p>
            <p className="text-base font-bold text-gray-800">{goalMet}/7 days</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">
          Loading…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={30}
              tickFormatter={(v) => `${v}g`}
            />
            {/* Dashed reference line at the daily protein goal */}
            <ReferenceLine
              y={proteinGoal}
              stroke="#3b82f6"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `Goal ${proteinGoal}g`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#3b82f6',
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              content={<CustomTooltip proteinGoal={proteinGoal} />}
            />
            <Bar dataKey="protein_g" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.isToday
                      ? '#1d4ed8'            // today — darker blue
                      : entry.protein_g >= proteinGoal
                      ? '#22c55e'            // goal met — green
                      : entry.protein_g > 0
                      ? '#93c5fd'            // logged but under goal — light blue
                      : '#e5e7eb'            // nothing logged — gray
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label, proteinGoal }) {
  if (!active || !payload?.length) return null;
  const { protein_g, date } = payload[0].payload;
  const pct = proteinGoal > 0 ? Math.round((protein_g / proteinGoal) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-blue-600 font-semibold">{Math.round(protein_g)}g protein</p>
      {protein_g > 0 && (
        <p className="text-gray-400 text-xs">{pct}% of {proteinGoal}g goal</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the ISO date strings and short day labels for the past 7 days
 * (oldest first, today last).
 */
function getLast7Days() {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      // Short label: "Mon", "Tue", … "Today"
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0,
    });
  }

  return {
    start: days[0].date,
    end: days[6].date,
    labels: days,
  };
}

/**
 * Merges the API range results (which only includes days that have logs)
 * with the full 7-day skeleton so every day is represented.
 */
function buildChartData(labels, rangeRows) {
  // Index range rows by date for O(1) lookup
  const byDate = Object.fromEntries(rangeRows.map((r) => [r.date, r]));

  return labels.map(({ date, label, isToday }) => ({
    date,
    label,
    isToday,
    protein_g: Number(byDate[date]?.protein_g ?? 0),
    calories: Number(byDate[date]?.calories ?? 0),
  }));
}
