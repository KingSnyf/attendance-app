import { cn } from "@/lib/utils"

const variantStyles = {
  success: "border-success-foreground/40 text-success-foreground",
  danger: "border-danger-foreground/40 text-danger-foreground",
  warning: "border-warning-foreground/40 text-warning-foreground",
  info: "border-signal/40 text-signal",
  brand: "border-brand/40 text-brand",
}

type BadgeProps = {
  variant?: keyof typeof variantStyles
  children: React.ReactNode
  className?: string
}

function Badge({ variant = "info", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "stamp-badge inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export { Badge }