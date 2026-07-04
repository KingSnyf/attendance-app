"use client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type PresenceChartProps = {
  data: Array<{ label: string; presents: number; absents: number }>
  period: "semaine" | "mois"
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function PresenceChart({ data, period }: PresenceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-border text-sm text-muted-foreground">
        Aucune donnée de présence pour cette période
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={6}>
          <defs>
            <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
            iconType="circle"
            formatter={(value) => <span className="text-foreground">{value}</span>}
          />
          <Bar
            dataKey="presents"
            name="Présents"
            fill="url(#gradPresent)"
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={600}
          />
          <Bar
            dataKey="absents"
            name="Absents"
            fill="url(#gradAbsent)"
            radius={[8, 8, 0, 0]}
            animationBegin={150}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { PresenceChart }
