import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const variantStyles = {
  success: "bg-success text-success-foreground",
  danger: "bg-danger text-danger-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-signal/10 text-signal",
}

const variantAccent = {
  success: "bg-success-foreground",
  danger: "bg-danger-foreground",
  warning: "bg-warning-foreground",
  info: "bg-signal",
}

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: number | string
  variant?: keyof typeof variantStyles
  hint?: string
  progress?: number
}

function StatCard({ icon: Icon, label, value, variant = "info", hint, progress }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex size-12 items-center justify-center rounded-full", variantStyles[variant])}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-data mt-1 text-[32px] font-bold leading-tight text-foreground">{value}</p>
      {typeof progress === "number" ? (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", variantAccent[variant])}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : (
        hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export { StatCard }