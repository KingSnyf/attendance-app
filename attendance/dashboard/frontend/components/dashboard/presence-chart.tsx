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

function PresenceChart({ data }: PresenceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-border text-sm text-muted-foreground">
        Aucune donnée de présence pour cette période
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e4e4e7",
              background: "#ffffff",
              fontSize: "13px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          <Bar dataKey="presents" name="Présents" fill="#4ade80" radius={[6, 6, 0, 0]} />
          <Bar dataKey="absents" name="Absents" fill="#fb7185" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { PresenceChart }
