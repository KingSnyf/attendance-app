import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const variantStyles = {
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
}

const variantBorders = {
  success: "border-l-emerald-500",
  danger: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-sky-500",
}

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: number | string
  variant?: keyof typeof variantStyles
}

function StatCard({ icon: Icon, label, value, variant = "info" }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md border-l-4",
      variantBorders[variant],
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={cn("rounded-xl p-3", variantStyles[variant])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

export { StatCard }
