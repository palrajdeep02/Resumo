"use client"

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface ChartItem {
  name: string
  applicants: number
}

export default function AnalyticsChart({ data }: { data: ChartItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-line rounded-[14px] bg-white">
        <p className="text-xs text-forest-soft font-semibold">No data available for job listings.</p>
      </div>
    )
  }

  return (
    <div className="h-72 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="name" stroke="var(--forest-soft)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--forest-soft)" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--sage-2)",
              borderColor: "var(--line)",
              borderRadius: "10px",
              color: "var(--forest)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="applicants" fill="var(--moss)" radius={[6, 6, 0, 0]} maxBarSize={45} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
