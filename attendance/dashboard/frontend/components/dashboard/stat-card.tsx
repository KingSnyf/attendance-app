import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const variantStyles = {
  success: "bg-[#e9f7f2] text-[#238b70]",
  danger: "bg-[#fbecee] text-[#bd4e5a]",
  warning: "bg-[#fff3e5] text-[#b87527]",
  info: "bg-[#edf3ff] text-[#5363dc]",
}

const variantAccent = {
  success: "bg-[#009668]",
  danger: "bg-[#93000a]",
  warning: "bg-[#0058be]",
  info: "bg-[#995c2e]",
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
    <div className="group rounded-lg border border-[#e1e5eb] bg-white shadow-[0_2px_8px_rgba(31,42,68,.03)] transition-all duration-300 hover:shadow-md p-4">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", variantStyles[variant])}>
          <Icon className="size-4.5" />
        </div>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a91a3]">{label}</p>
      <p className="font-data mt-1 text-xl font-bold leading-tight text-[#17203a]">{value}</p>
      {typeof progress === "number" ? (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#eef0f3]">
          <div
            className={cn("h-full rounded-full", variantAccent[variant])}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : (
        hint && <p className="mt-3 text-[9px] text-[#8a91a3]">{hint}</p>
      )}
    </div>
  )
}

export { StatCard }