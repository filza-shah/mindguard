// frontend/src/components/charts/MoodTrendChart.tsx
//
// Recharts is a D3-based chart library built for React.
// All chart components are just React components — easy to customise.

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MoodTrend } from "@/types";

interface Props {
  data: MoodTrend[];
}

// Custom tooltip — shown when hovering over a data point
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-slate-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-slate-600">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.name}:</span>
          <span className="font-medium">{entry.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export function MoodTrendChart({ data }: Props) {
  // Format date labels for the X axis (e.g. "Jun 1")
  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    // ResponsiveContainer makes the chart fill its parent's width automatically
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip content={<CustomTooltip />} />
        
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
        />

        {/* Mood line */}
        <Line
          type="monotone"
          dataKey="avg_mood"
          name="mood"
          stroke="#0ea5e9"        // brand-500
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 0, fill: "#0ea5e9" }}
          activeDot={{ r: 5 }}
        />

        {/* Energy line */}
        <Line
          type="monotone"
          dataKey="avg_energy"
          name="energy"
          stroke="#22c55e"        // green
          strokeWidth={2}
          strokeDasharray="4 2"   // dashed to visually distinguish
          dot={false}
        />

        {/* Anxiety line (inverted perception: high score = calm) */}
        <Line
          type="monotone"
          dataKey="avg_anxiety"
          name="calm"
          stroke="#a855f7"        // purple
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
