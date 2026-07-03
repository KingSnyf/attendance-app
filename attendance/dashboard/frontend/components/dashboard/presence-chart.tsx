"use client"

type PresenceChartProps = {
  data: Array<{ label: string; presents: number; absents: number }>
  period: "semaine" | "mois"
}

function PresenceChart({ data, period }: PresenceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-border text-sm text-muted-foreground">
        Aucune donnée de présence pour cette période
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.presents + d.absents), 1)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {data.map((item, i) => {
          const total = item.presents + item.absents
          const presentHeight = (item.presents / max) * 140
          const absentHeight = (item.absents / max) * 140
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col-reverse" style={{ height: 140 }}>
                <div
                  className="w-full rounded-t bg-emerald-400 transition-all"
                  style={{ height: `${presentHeight}px` }}
                />
                <div
                  className="w-full rounded-t bg-rose-400 transition-all"
                  style={{ height: `${absentHeight}px` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-emerald-400" /> Présents
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-rose-400" /> Absents
        </span>
      </div>
    </div>
  )
}

export { PresenceChart }
