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
  title?: string
  subtitle?: string
  action?: React.ReactNode
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

function PresenceChart({ data, title, subtitle, action }: PresenceChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            {title && <h4 className="font-heading text-lg font-semibold text-foreground">{title}</h4>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}

      {data.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
          Aucune donnée de présence pour cette période
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barGap={6}>
            <defs>
              <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--success-foreground)" stopOpacity={1} />
                <stop offset="100%" stopColor="var(--success-foreground)" stopOpacity={0.65} />
              </linearGradient>
              <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--danger-foreground)" stopOpacity={1} />
                <stop offset="100%" stopColor="var(--danger-foreground)" stopOpacity={0.65} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)" }} />
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
      )}
    </div>
  )
}

export { PresenceChart }