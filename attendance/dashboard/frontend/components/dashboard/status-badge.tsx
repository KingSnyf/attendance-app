import { cn } from "@/lib/utils"

const variantBorders = {
  success: "border-success-foreground text-success-foreground",
  danger: "border-danger-foreground text-danger-foreground",
  warning: "border-warning-foreground text-warning-foreground",
  info: "border-signal/70 text-signal",
  brand: "border-brand text-brand",
}

type BadgeProps = {
  variant?: keyof typeof variantBorders
  children: React.ReactNode
  className?: string
}

function Badge({ variant = "info", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        "border",
        variantBorders[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export { Badge }