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
}

function StatCard({ icon: Icon, label, value, variant = "info" }: StatCardProps) {
  return (
    <div className="punch-notch relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
      <span
        className={cn("absolute inset-x-0 top-0 h-0.75", variantAccent[variant])}
        aria-hidden
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="stamp-badge text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="font-data mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={cn("rounded-lg p-2.5", variantStyles[variant])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

export { StatCard }